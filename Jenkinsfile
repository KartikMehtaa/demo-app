@Library('my-shared-library') 
pipeline {
    agent any

    stages {
        stage('Deploy') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        deployBackend(
                            server: 'server-1',
                            credentialId: 'server-1-ssh'
                        )
                    } else if (env.BRANCH_NAME == 'staging') {
                        deployBackend(
                            server: 'staging-1',
                            credentialId: 'staging-server-1-ssh'
                        )
                    } else {
                        error("Deployment not configured for branch: ${env.BRANCH_NAME}")
                    }
                }
            }
        }
    }
}