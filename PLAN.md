🧠 Multimodal Rust App with Candle + Tauri + YAML Config

This project integrates a multimodal LLM (SmolVLM-500M-Instruct) using the Candle framework in Rust, with a Tauri + HTML frontend, webcam support, and YAML-based runtime configuration.

---

🧱 Project Architecture Overview

🔩 Backend (Rust + Candle + Tauri)
- Use `candle` for model inference (Metal/CUDA supported).
- Integrate webcam feed using `opencv` or `rscam`.
- Parse YAML config at startup.
- Expose Tauri commands to:
  - Load model
  - Run inference with { image, text } → prompt → model → response
- Throttle image input by `vision_input_interval` (e.g. 500ms).
- Output: JSON response sent to frontend.

🖥️ Frontend (HTML + CSS + JS via Tauri)
- Live webcam preview via `navigator.mediaDevices.getUserMedia()`.
- Text input + "Send" button.
- Display model response.
- Option to edit/override prompt template.
- Dropdown to select model from YAML.

---

🛠️ YAML Configuration Example

models:
  smolvlm:
    name: "SmolVLM-500M-Instruct"
    model_path: "./models/smolvlm.gguf"
    device: "cuda"  # or "metal"
    prompt_template: "User: {instruction}\\nImage: {image_token}\\nAssistant:"
    vision_input_interval: 500  # ms
    tokenizer: "./models/tokenizer.model"

---

🔁 Prompt Template Logic

Template in YAML:

User: {instruction}
Image: {image_token}
Assistant:

- {instruction} → user text input.
- {image_token} → preprocessed or encoded image input.

---

🔧 Backend Implementation Plan (Rust + Candle + Tauri)

1. Parse YAML Config using `serde_yaml`.
2. Load model with Candle at startup.
3. Capture Webcam Frame:
   - Use `opencv` crate
   - Resize and convert image as needed
4. Prompt Construction:
   - Use YAML or frontend-modified template
   - Insert text + image
5. Run Inference:
   - Model runs with prompt
   - Return result as JSON
6. Tauri Commands:
   - `run_inference(instruction: String)`
   - `get_models()` → from YAML

---

🌐 Frontend Plan (Tauri + Web)

- Webcam preview via <video> + JS
- JS captures still image (e.g. every 500ms)
- Send image + text to backend
- Show model's JSON response
- Dropdown to switch model
- Editable prompt template

---

🧪 Dependencies Overview

Cargo.toml:

[dependencies]
tauri = { version = "1", features = ["api-all"] }
serde = { version = "1", features = ["derive"] }
serde_yaml = "0.9"
candle-core = "0.3"
opencv = "0.74"
image = "0.25"
tokio = { version = "1", features = ["full"] }

---

✅ Next Steps

1. Create directory layout for:
   - /src-tauri
   - /frontend
2. Implement:
   - YAML parsing
   - Webcam image capture
   - Model runner with prompt builder
   - Tauri interface
3. Build Tauri UI:
   - Webcam + text + response area
   - Model selector
   - Editable prompt template
