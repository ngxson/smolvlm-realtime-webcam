use crate::config::ModelConfig;
use anyhow::Result;
use candle_core::Device;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct ModelRunner {
    config: ModelConfig,
    device: Device,
}

#[derive(Serialize, Deserialize)]
pub struct InferenceRequest {
    pub instruction: String,
    pub image_data: Option<Vec<u8>>,
    pub model_name: String,
}

#[derive(Serialize, Deserialize)]
pub struct InferenceResponse {
    pub response: String,
    pub processing_time_ms: u64,
    pub model_used: String,
}

impl ModelRunner {
    pub fn new(config: ModelConfig) -> Result<Self> {
        let device = match config.device.as_str() {
            "cuda" => Device::new_cuda(0)?,
            "metal" => Device::new_metal(0)?,
            _ => Device::Cpu,
        };

        Ok(ModelRunner { config, device })
    }

    pub async fn run_inference(&self, request: InferenceRequest) -> Result<InferenceResponse> {
        let _prompt = self.build_prompt(&request.instruction, request.image_data.is_some());

        // Use the device field to show it's being used
        log::info!("Running inference on device: {:?}", self.device);

        // For now, return a simulated response since we don't have a real model loaded
        let response = if request.model_name == "demo" {
            if request.image_data.is_some() {
                format!("I can see an image in your webcam feed. You asked: '{}'. This is a demo response showing that the multimodal system is working!", request.instruction)
            } else {
                format!(
                    "You asked: '{}'. This is a demo response from the simulated model.",
                    request.instruction
                )
            }
        } else {
            format!(
                "Model '{}' processing: {}",
                request.model_name, request.instruction
            )
        };

        Ok(InferenceResponse {
            response,
            model_used: self.config.name.clone(),
            processing_time_ms: 150, // Simulated processing time
        })
    }

    fn build_prompt(&self, instruction: &str, has_image: bool) -> String {
        let image_token = if has_image { "[IMAGE]" } else { "" };

        self.config
            .prompt_template
            .replace("{instruction}", instruction)
            .replace("{image_token}", image_token)
    }
}

// Global model manager
pub type ModelManager = Arc<Mutex<Option<ModelRunner>>>;

pub fn create_model_manager() -> ModelManager {
    Arc::new(Mutex::new(None))
}
