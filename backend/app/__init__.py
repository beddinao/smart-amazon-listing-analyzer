import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  # Disable GPU
os.environ["TORCH_CPU_ONLY"] = "1"  # Force CPU for PyTorch
