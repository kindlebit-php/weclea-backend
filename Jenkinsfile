pipeline {
    agent { label 'weclea_server' }
    
    stages {
        stage('Code') {
            steps {
                script {
                    // Add private GitHub credentials here
                    withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_TOKEN')]) {
                        git url: 'https://github.com/kindlebit-php/weclea-backend.git', branch: 'main', credentialsId: 'github-credentials'
                    }
                }
            }
        }
        
        stage('Build and Test') {
            steps {
                // Run Build and tests here
                sh 'docker build . -t kindlebit143/weclea-backend:v2.0'
                // Add your build and test commands here
            }
        }
        
        stage('Login and Push Image') {
            steps {
                // Login and push code on DockerHub using CI/CD
                echo 'Pushing code to DockerHub'
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh '''
                        docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
                        docker push kindlebit143/weclea-backend:v2.0
                    '''
                }
            }
        }
        
        stage('Deploy on server') {
            steps {
                // Perform cleanup steps here (e.g., deleting temporary files)
                sh 'docker-compose down' 
                sh 'docker-compose up -d'
                // Add your cleanup commands here
            }
        }
    }
    
    post {
        always {
            // Cleanup steps to be executed regardless of the pipeline status
            echo 'Pipeline finished'
        }
        
        success {
            // Steps to be executed if the pipeline succeeds
            echo 'Pipeline succeeded'
            emailext (
                subject: 'Congratulations Team:  Your Weclea backend Code is Successfully Build and Deploy on Server',
                body: 'We are thrilled to announce that our latest pipeline has triumphed with flying colors!',
                to: 'adityakumar8ks@gmail.com' // Specify multiple email addresses separated by commas
            )
        }
        
        failure {
            // Steps to be executed if the pipeline fails
            echo 'Pipeline failed'
            emailext (
                subject: 'Attention Team: Your Weclea backend Code Build and Deployment Failed',
                body: 'The pipeline failed. Please check!',
                to: 'adityakumar8ks@gmail.com' // Specify multiple email addresses separated by commas
            )
        }
    }
}
