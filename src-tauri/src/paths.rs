use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum PathError {
    #[error("Failed to determine system home directory")]
    NoHomeDir,
    #[error("Failed to create application directories: {0}")]
    IoError(#[from] std::io::Error),
}

#[derive(Debug, Clone)]
pub struct AppPaths {
    pub app_install_dir: PathBuf,
    pub app_data_dir: PathBuf,
    pub extensions_dir: PathBuf,
    pub blackboard_dir: PathBuf,
    pub custom_prompts_dir: PathBuf,
}

impl AppPaths {
    pub fn resolve() -> Result<Self, PathError> {
        #[cfg(target_os = "windows")]
        {
            let local_data = dirs::data_local_dir().ok_or(PathError::NoHomeDir)?;
            let roaming_data = dirs::config_dir().ok_or(PathError::NoHomeDir)?;
            let home = dirs::home_dir().ok_or(PathError::NoHomeDir)?;

            let app_install_dir = local_data.join("Programs").join("syntrophyOS");
            let app_data_dir = roaming_data.join("syntrophyOS");
            let extensions_dir = home.join(".syntrophyOS").join("extensions");
            let blackboard_dir = app_data_dir.join("blackboard");
            let custom_prompts_dir = app_data_dir.join("custom_prompts");

            Ok(Self {
                app_install_dir,
                app_data_dir,
                extensions_dir,
                blackboard_dir,
                custom_prompts_dir,
            })
        }

        #[cfg(target_os = "macos")]
        {
            let home = dirs::home_dir().ok_or(PathError::NoHomeDir)?;
            let app_install_dir = PathBuf::from("/Applications/syntrophyOS.app");
            let app_data_dir = home.join("Library").join("Application Support").join("syntrophyOS");
            let extensions_dir = home.join(".syntrophyOS").join("extensions");
            let blackboard_dir = app_data_dir.join("blackboard");
            let custom_prompts_dir = app_data_dir.join("custom_prompts");

            Ok(Self {
                app_install_dir,
                app_data_dir,
                extensions_dir,
                blackboard_dir,
                custom_prompts_dir,
            })
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        {
            let home = dirs::home_dir().ok_or(PathError::NoHomeDir)?;
            let config = dirs::config_dir().unwrap_or_else(|| home.join(".config"));

            let app_install_dir = PathBuf::from("/opt/syntrophyOS");
            let app_data_dir = config.join("syntrophyOS");
            let extensions_dir = home.join(".syntrophyOS").join("extensions");
            let blackboard_dir = app_data_dir.join("blackboard");
            let custom_prompts_dir = app_data_dir.join("custom_prompts");

            Ok(Self {
                app_install_dir,
                app_data_dir,
                extensions_dir,
                blackboard_dir,
                custom_prompts_dir,
            })
        }
    }

    pub fn ensure_directories(&self) -> Result<(), PathError> {
        std::fs::create_dir_all(&self.app_data_dir)?;
        std::fs::create_dir_all(&self.extensions_dir)?;
        std::fs::create_dir_all(&self.blackboard_dir)?;
        std::fs::create_dir_all(&self.custom_prompts_dir)?;
        Ok(())
    }
}
