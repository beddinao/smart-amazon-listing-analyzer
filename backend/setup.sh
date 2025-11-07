#/bin/bash

cd /backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

if [ ! -f /pip_configured ]; then
	./install.sh
	./fix.sh
	echo "pip is done" > /pip_configured
fi

python3 main.py
