# SmolVLM real-time camera demo

![demo](./demo.png)

This repository is a simple demo for how to use LM Studio server with SmolVLM 500M to get real-time object detection from web camera. This a fork from [ngxson/smolvlm-realtime-webcam](ngxson/smolvlm-realtime-webcam) which focus on ollama. 
System prompt was also added along with usability improvement. 

## How to setup

1. Download and Install [LM Studio](https://lmstudio.ai/)
2. Inside LM Studio, download `https://model.lmstudio.ai/download/ggml-org/SmolVLM-500M-Instruct-GGUF`  
3. In command prompt terminal (administrator right):
    > lms server start --cors

    > lms load

    then select `ggml-org/SmolVLM-500M-Instruct-GGUF`
3. Open `index.html`. Allow the camera to turn on.
4. Optionally change the instruction (for example, make it returns JSON)
5. Click on "Start" and enjoy
