FROM debian:latest

RUN apt update -y && apt upgrade -y
RUN apt install -y git vim ssh npm

COPY . /frontend

WORKDIR /frontend

RUN npm install

CMD ["npm", "run", "dev"]
