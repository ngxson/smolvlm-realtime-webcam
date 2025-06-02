use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ModelConfig {
    pub name: String,
    pub model_path: String,
    pub device: String,
    pub prompt_template: String,
    pub vision_input_interval: u64,
    pub tokenizer: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AppConfig {
    pub default_model: String,
    pub webcam_device: i32,
    pub image_resize_width: u32,
    pub image_resize_height: u32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    pub models: HashMap<String, ModelConfig>,
    pub app: AppConfig,
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let config_path = std::env::current_dir()?.join("config.yaml");
        let config_str = std::fs::read_to_string(config_path)?;
        let config: Config = serde_yaml::from_str(&config_str)?;
        Ok(config)
    }
}
