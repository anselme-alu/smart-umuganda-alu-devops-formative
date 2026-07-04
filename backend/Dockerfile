# Fetch the base image for the backend project
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

# Use a smaller base image for the final stage
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the migration files so they can be applied at startup
COPY --from=builder /app/drizzle ./drizzle

# Copy package.json and yarn.lock for production dependencies
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile

# Expose the port the app runs on
EXPOSE 8000

# Run migrations, then start the application
CMD ["sh", "-c", "yarn db:migrate:run && node dist/server.js"]
