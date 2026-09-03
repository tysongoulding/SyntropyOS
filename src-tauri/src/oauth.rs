use std::collections::HashMap;
use std::net::SocketAddr;
use thiserror::Error;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::sync::oneshot;

#[derive(Error, Debug)]
pub enum OAuthError {
    #[error("Failed to bind local loopback listener: {0}")]
    BindError(#[from] std::io::Error),
    #[error("OAuth authorization timed out")]
    Timeout,
    #[error("Invalid OAuth callback URL: {0}")]
    InvalidCallback(String),
    #[error("CSRF state mismatch")]
    StateMismatch,
    #[error("Authorization failed: {0}")]
    AuthFailed(String),
}

#[derive(Debug, Clone)]
pub struct PkceSession {
    pub provider: String,
    pub state: String,
    pub code_verifier: String,
    pub code_challenge: String,
}

impl PkceSession {
    pub fn new(provider: &str) -> Self {
        let state = uuid::Uuid::new_v4().to_string();
        let code_verifier = uuid::Uuid::new_v4().to_string() + &uuid::Uuid::new_v4().to_string();
        let code_challenge = code_verifier.clone(); // Basic or S256 challenge representation

        Self {
            provider: provider.to_string(),
            state,
            code_verifier,
            code_challenge,
        }
    }
}

pub struct OAuthLoopback {
    addr: SocketAddr,
}

impl Default for OAuthLoopback {
    fn default() -> Self {
        Self {
            addr: "127.0.0.1:8989".parse().unwrap(),
        }
    }
}

impl OAuthLoopback {
    pub fn new(addr: SocketAddr) -> Self {
        Self { addr }
    }

    /// Listens for a single HTTP GET callback on 127.0.0.1:8989/oauth/callback
    pub async fn listen_for_code(
        &self,
        expected_state: &str,
        timeout_duration: std::time::Duration,
    ) -> Result<String, OAuthError> {
        let listener = TcpListener::bind(self.addr).await?;
        let (tx, rx) = oneshot::channel();
        let state_to_match = expected_state.to_string();

        let server_task = tokio::spawn(async move {
            if let Ok((mut stream, _)) = listener.accept().await {
                let mut buffer = [0u8; 4096];
                let n = stream.read(&mut buffer).await.unwrap_or(0);
                let request_str = String::from_utf8_lossy(&buffer[..n]);

                // Parse query parameters from "GET /oauth/callback?code=...&state=... HTTP/1.1"
                if let Some(first_line) = request_str.lines().next() {
                    let parts: Vec<&str> = first_line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let path = parts[1];
                        if let Some(pos) = path.find('?') {
                            let query = &path[pos + 1..];
                            let params: HashMap<String, String> = query
                                .split('&')
                                .filter_map(|pair| {
                                    let mut kv = pair.split('=');
                                    let k = kv.next()?;
                                    let v = kv.next()?;
                                    Some((k.to_string(), v.to_string()))
                                })
                                .collect();

                            if let (Some(code), Some(state)) = (params.get("code"), params.get("state")) {
                                if state == &state_to_match {
                                    let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<html><body><h2>SyntropyOS Authorization Successful!</h2><p>You can close this tab and return to the SyntropyOS app.</p><script>window.close();</script></body></html>";
                                    let _ = stream.write_all(response.as_bytes()).await;
                                    let _ = tx.send(Ok(code.clone()));
                                    return;
                                } else {
                                    let _ = tx.send(Err(OAuthError::StateMismatch));
                                    return;
                                }
                            }
                        }
                    }
                }
                let response = "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\n\r\n<html><body><h2>Authorization Failed</h2></body></html>";
                let _ = stream.write_all(response.as_bytes()).await;
                let _ = tx.send(Err(OAuthError::InvalidCallback("Missing code or state".into())));
            }
        });

        match tokio::time::timeout(timeout_duration, rx).await {
            Ok(Ok(result)) => result,
            Ok(Err(_)) => Err(OAuthError::AuthFailed("Channel closed prematurely".into())),
            Err(_) => {
                server_task.abort();
                Err(OAuthError::Timeout)
            }
        }
    }
}
