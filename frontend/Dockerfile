FROM node:24-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Use nginx as the base image for the final stage (The web server for react app)
FROM nginx:alpine

# Copy the built application from the builder stage to the nginx html directory
COPY --from=builder /app/dist /var/www/html

# Copy the nginx configuration file
COPY configs/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port the app runs on
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
