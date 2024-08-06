FROM node:22

WORKDIR /home/emerix/coding_projects/webDev/serverDashBoard/

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=80

EXPOSE 80

CMD ["npm", "start"]
