# Stage containing the bare minimum node_modules for running the server in
# production.
FROM amazon/aws-lambda-nodejs:20 AS prod-deps

# Install node-prune. We'll use it later.
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

# Copy over the bare requirements for running `yarn` to install the server
# dependencies, then do it.
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --omit dev
RUN node-prune

# Stage for building the server.
FROM prod-deps AS server

RUN npm ci
COPY . .
RUN npm run build

# We have all the parts we need in different stages. Combine them together.
FROM amazon/aws-lambda-nodejs:20

WORKDIR /usr/src/app
COPY index.js ./
COPY --from=prod-deps /usr/src/app/node_modules node_modules
COPY --from=server /usr/src/app/dist dist