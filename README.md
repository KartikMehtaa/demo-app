# Node.js Demo App

This is a Node.js demo application built using **Express.js** and **MongoDB**.

The application provides the following functionality:

* Insert user data into MongoDB.
* Fetch stored data from MongoDB.
* Display the data on the frontend.
* Display the application server's:

  * Hostname
  * Private IP address
  * Public IP address

![Node.js Demo Application](nodejs-app-demo.jpg)

---

## Project Architecture

```text
                 GitHub
                    |
                    | Push code
                    ↓
                 Jenkins
                    |
              Docker Build
                    |
                    ↓
               Docker Hub
                    |
                    | Pull image
                    ↓
             Docker Compose
              /          \
             ↓            ↓
        Node.js App     MongoDB
          :5000          :27017
```

---

## Technologies Used

* Node.js
* Express.js
* MongoDB
* Docker
* Docker Compose
* Jenkins
* Docker Hub
* Git/GitHub
* Nginx Reverse Proxy

---

# 1. Clone the Repository

Clone the project:

```bash
git clone <YOUR_REPOSITORY_URL>
cd nodejs-demo-app
```

---

# 2. Install Docker and Docker Compose

Install Docker and Docker Compose on the server.

Verify the installation:

```bash
docker --version
docker compose version
```

Make sure Docker is running:

```bash
sudo systemctl status docker
```

---

# 3. Configure Environment Variables

Create a `.env` file:

```bash
nano .env
```

Example:

```env
PORT=5000
MONGO_USER=admin
MONGO_PASSWORD=admin123
MONGO_DB=mydatabase
MONGO_PORT=27017
```

The `.env` file contains application configuration and sensitive values.

**Do not commit `.env` to GitHub.**

Add it to `.gitignore`:

```gitignore
.env
node_modules/
```

---

# 4. Start the Application with Docker Compose

Run:

```bash
docker compose up -d
```

Check the containers:

```bash
docker compose ps
```

Expected services:

```text
node-app
mongodb
```

The Node.js application is available on:

```text
http://localhost:5000
```

---

# 5. MongoDB

MongoDB runs in its own Docker container.

The Node.js application connects to MongoDB using the Docker Compose service name:

```text
mongo
```

The application should not use `localhost` to connect to MongoDB from inside the Node.js container.

Example MongoDB connection:

```text
mongodb://admin:admin123@mongo:27017/?authSource=admin
```

---

# 6. Check MongoDB Data

Find the MongoDB container:

```bash
docker ps
```

Access MongoDB:

```bash
docker exec -it mongodb mongosh \
  -u admin \
  -p 'admin123' \
  --authenticationDatabase admin
```

Then:

```javascript
show dbs
```

Select the database:

```javascript
use mydatabase
```

Show collections:

```javascript
show collections
```

View the data:

```javascript
db.mycollection.find().pretty()
```

Count documents:

```javascript
db.mycollection.countDocuments()
```

---

# 7. MongoDB Data Persistence

MongoDB uses a Docker named volume:

```yaml
volumes:
  - mongo_data:/data/db
```

This keeps MongoDB data persistent when the container is recreated.

Avoid using:

```bash
docker compose down -v
```

unless you intentionally want to delete the MongoDB volume and its data.

---

# 8. Jenkins Installation

Install Jenkins on the server.

After installation, verify Jenkins:

```bash
sudo systemctl status jenkins
```

Jenkins normally runs on:

```text
http://SERVER_IP:8080
```

---

# 9. Jenkins Docker Access

Jenkins needs permission to execute Docker commands.

Add the Jenkins user to the Docker group:

```bash
sudo usermod -aG docker jenkins
```

Restart Jenkins:

```bash
sudo systemctl restart jenkins
```

You may need to log out and back in for group membership changes to take effect.

Verify:

```bash
sudo -u jenkins docker ps
```

---

# 10. Docker Hub Credentials in Jenkins

The Jenkins pipeline pushes the Docker image to Docker Hub.

Create a Docker Hub credential in Jenkins:

```text
Jenkins
 → Manage Jenkins
 → Credentials
 → Global
 → Add Credentials
```

Use:

```text
Kind: Username with password
ID: docker-creds-pakhii
Username: kartikmehta
Password: Docker Hub Access Token
```

Use a **Docker Hub Access Token** instead of storing the Docker Hub account password.

---

# 11. Jenkins Pipeline

The CI/CD pipeline follows this order:

```text
1. Checkout code
       ↓
2. Build Docker image
       ↓
3. Push image to Docker Hub
       ↓
4. Deploy using Docker Compose
       ↓
5. Verify deployment
```

The Docker Hub image repository is:

```text
kartikmehta/nodejs-demo
```

Example image tags:

```text
kartikmehta/nodejs-demo:1
kartikmehta/nodejs-demo:2
kartikmehta/nodejs-demo:3
```

The Jenkins `BUILD_NUMBER` is used as the image tag.

---

# 12. Jenkinsfile

Copy the Jenkinsfile into the root of the project:

```text
nodejs-demo-app/
├── index.js
├── index.html
├── package.json
├── Dockerfile
├── docker-compose.yml
├── Jenkinsfile
├── .dockerignore
└── .env
```

The `.env` file should remain outside GitHub and should not be committed.

In the Jenkinsfile, use the Docker Hub credential:

```groovy
withCredentials([
    usernamePassword(
        credentialsId: 'docker-creds-pakhii',
        usernameVariable: 'DOCKER_USER',
        passwordVariable: 'DOCKER_PASSWORD'
    )
]) {
    // Docker login and push
}
```

---

# 13. Docker Build and Push

Jenkins builds the application image:

```bash
docker build -t kartikmehta/nodejs-demo:${BUILD_NUMBER} .
```

It also creates the `latest` tag:

```bash
docker tag kartikmehta/nodejs-demo:${BUILD_NUMBER} \
           kartikmehta/nodejs-demo:latest
```

Then Jenkins pushes the image:

```bash
docker push kartikmehta/nodejs-demo:${BUILD_NUMBER}
docker push kartikmehta/nodejs-demo:latest
```

---

# 14. Deployment

After the image is successfully pushed to Docker Hub, Jenkins deploys it using Docker Compose:

```bash
export IMAGE_TAG=${BUILD_NUMBER}

docker compose pull app
docker compose up -d
```

This ensures that the server deploys the Docker image produced by the current Jenkins build.

---

# 15. Nginx Reverse Proxy

Nginx can be used as a reverse proxy in front of the Node.js application.

Instead of accessing:

```text
http://localhost:5000
```

the user can access:

```text
http://localhost
```

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://127.0.0.1:5000;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Test the Nginx configuration:

```bash
sudo nginx -t
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

The request flow becomes:

```text
Browser
   |
   | http://localhost
   ↓
 Nginx :80
   |
   | proxy
   ↓
Node.js :5000
   |
   ↓
MongoDB
```

---

# 16. Useful Docker Commands

Check running containers:

```bash
docker ps
```

Check Compose services:

```bash
docker compose ps
```

View Node.js logs:

```bash
docker logs node-app
```

View MongoDB logs:

```bash
docker logs mongodb
```

Follow application logs:

```bash
docker logs -f node-app
```

Stop the application:

```bash
docker compose down
```

Start the application:

```bash
docker compose up -d
```

Pull the latest image:

```bash
docker compose pull
```

---

# 17. CI/CD Flow

When a developer pushes code to GitHub:

```text
Developer
    |
    | git push
    ↓
GitHub
    |
    | Webhook
    ↓
Jenkins
    |
    ↓
Checkout
    |
    ↓
Docker Build
    |
    ↓
Docker Hub
    |
    ↓
Docker Compose Pull
    |
    ↓
Deploy
    |
    ├── Node.js Container
    |
    └── MongoDB Container
```

The `.env` file does not need to come from GitHub.

The deployment server keeps its own `.env` file containing the required environment variables.

---

# 18. Important Security Notes

Do not commit the following to GitHub:

```text
.env
Passwords
Docker Hub passwords
Database credentials
API keys
Private keys
Access tokens
```

Use:

* `.gitignore`
* Jenkins Credentials
* Docker secrets
* AWS Secrets Manager
* HashiCorp Vault

for sensitive information in production.

---

# 19. Final Project Summary

This project demonstrates a basic production-style DevOps workflow for a Node.js application.

The application is containerized using Docker, MongoDB is run as a separate container with persistent storage, and Docker Compose manages both services.

Jenkins automates the CI/CD process:

```text
GitHub
  ↓
Jenkins
  ↓
Docker Build
  ↓
Docker Hub
  ↓
Docker Compose
  ↓
Application Deployment
```

Nginx can additionally be placed in front of the application as a reverse proxy, allowing users to access the application through a standard HTTP/HTTPS endpoint instead of directly exposing the Node.js port.
## Final Output

![Final Output](./final-output.png)