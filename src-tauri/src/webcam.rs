use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebcamFrame {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub format: String,
}

pub struct WebcamManager {
    pub device_id: Option<String>,
}

impl WebcamManager {
    pub fn new() -> Self {
        Self { device_id: None }
    }

    pub fn set_device(&mut self, device_id: String) {
        self.device_id = Some(device_id);
    }

    // Process image data received from the frontend
    pub fn process_frame_data(&self, image_data: Vec<u8>) -> Result<WebcamFrame> {
        // For now, we'll assume the data is already in the correct format
        // In a real implementation, you might want to decode and process the image
        Ok(WebcamFrame {
            data: image_data,
            width: 640,
            height: 480,
            format: "jpeg".to_string(),
        })
    }

    // Convert frame to format suitable for model input
    pub fn prepare_for_model(&self, frame: &WebcamFrame) -> Result<image::DynamicImage> {
        let img = image::load_from_memory(&frame.data)?;
        Ok(img)
    }
}
