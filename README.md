# SmolVLM real-time camera demo

![demo](./demo.png)

This repository is a simple demo for how to use llama.cpp server with SmolVLM 500M to get real-time object detection

## How to setup

1. Install [llama.cpp](https://github.com/ggml-org/llama.cpp) [refer](https://blog.steelph0enix.dev/posts/llama-cpp-guide/)
2. 
3. Run `./llama-server -hf ggml-org/SmolVLM-500M-Instruct-GGUF`  or `./llama-cli -hf ggml-org/SmolVLM-500M-Instruct-GGUF`
   Note: you may need to add `-ngl 99` to enable GPU (if you are using NVidia/AMD/Intel GPU)  
   Note (2): You can also try other models [here](https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md)
4. Open `index.html`
5. Optionally change the instruction (for example, make it returns JSON)
6. Click on "Start" and enjoy
