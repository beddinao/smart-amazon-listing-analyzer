FROM debian:latest

RUN apt update -y && apt upgrade -y
RUN apt install -y vim git ssh python3 python3-venv python3-dev

COPY . /backend/
COPY setup.sh /

CMD ["/bin/bash", "/backend/setup.sh"]
