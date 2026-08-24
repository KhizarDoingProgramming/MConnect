FROM node:20

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Copy your actual workspace directories
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Run installation and build inside the workspace
RUN npm install
RUN cd apps/api && npm install && npx prisma generate && npm run build

EXPOSE 7860

# Pass the mandatory port and boot up the backend workspace
ENV PORT=7860
CMD ["npm", "run", "start", "--workspace=apps/api"]
