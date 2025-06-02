mod config;
mod model;
mod webcam;

use config::Config;
use model::{InferenceRequest, InferenceResponse, ModelManager, ModelRunner};
use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::Mutex;
use webcam::WebcamManager;

// Application state
pub struct AppState {
    pub config: Config,
    pub model_manager: ModelManager,
    pub webcam_manager: Arc<Mutex<WebcamManager>>,
}

// Tauri commands
#[tauri::command]
async fn get_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let models: Vec<String> = state.config.models.keys().cloned().collect();
    Ok(models)
}

#[tauri::command]
async fn load_model(model_name: String, state: State<'_, AppState>) -> Result<String, String> {
    let model_config = state
        .config
        .models
        .get(&model_name)
        .ok_or_else(|| format!("Model '{}' not found", model_name))?
        .clone();

    let model_runner =
        ModelRunner::new(model_config).map_err(|e| format!("Failed to load model: {}", e))?;

    let mut manager = state.model_manager.lock().await;
    *manager = Some(model_runner);

    Ok(format!("Model '{}' loaded successfully", model_name))
}

#[tauri::command]
async fn run_inference(
    instruction: String,
    include_webcam: bool,
    webcam_data: Option<Vec<u8>>,
    state: State<'_, AppState>,
) -> Result<InferenceResponse, String> {
    let manager = state.model_manager.lock().await;
    let model = manager
        .as_ref()
        .ok_or_else(|| "No model loaded. Please load a model first.".to_string())?;

    let image_data = if include_webcam && webcam_data.is_some() {
        let webcam_manager = state.webcam_manager.lock().await;
        match webcam_manager.process_frame_data(webcam_data.unwrap()) {
            Ok(frame) => {
                // Convert frame to format suitable for model
                match webcam_manager.prepare_for_model(&frame) {
                    Ok(_img) => Some(frame.data),
                    Err(e) => {
                        log::warn!("Failed to prepare image for model: {}", e);
                        None
                    }
                }
            }
            Err(e) => {
                log::warn!("Failed to process webcam frame: {}", e);
                None
            }
        }
    } else {
        None
    };

    let request = InferenceRequest {
        instruction,
        image_data,
        model_name: state.config.app.default_model.clone(),
    };

    model
        .run_inference(request)
        .await
        .map_err(|e| format!("Inference failed: {}", e))
}

#[tauri::command]
async fn get_config(state: State<'_, AppState>) -> Result<Config, String> {
    Ok(state.config.clone())
}

#[tauri::command]
async fn update_webcam_device(
    device_id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut webcam_manager = state.webcam_manager.lock().await;
    webcam_manager.set_device(device_id.clone());
    Ok(format!("Webcam device updated to: {}", device_id))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::init();

    tauri::Builder::default()
        .setup(|app| {
            // Load configuration
            let config = Config::load().map_err(|e| format!("Failed to load config: {}", e))?;

            // Initialize application state
            let app_state = AppState {
                config,
                model_manager: model::create_model_manager(),
                webcam_manager: Arc::new(Mutex::new(WebcamManager::new())),
            };

            app.manage(app_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_models,
            load_model,
            run_inference,
            get_config,
            update_webcam_device
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
