pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = '061882422364'

        ECR_REPOSITORY = 'expense-tracker-backend'
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_IMAGE = "${ECR_REGISTRY}/${ECR_REPOSITORY}"

        ECS_CLUSTER = 'expense-tracker-aws'
        ECS_SERVICE = 'expense-tracker-backend-aws'
        ECS_TASK_FAMILY = 'expense-tracker-backend-aws'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare') {
            steps {
                script {
                    env.IMAGE_TAG = sh(
                        script: 'git rev-parse --short=12 HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Building image: ${ECR_IMAGE}:${IMAGE_TAG}"
                }
            }
        }

        stage('Docker Build') {
    steps {
        sh 'docker build -f Dockerfile -t ${ECR_IMAGE}:${IMAGE_TAG} .'
    }
}

        stage('ECR Login') {
            steps {
                sh '''
                    aws ecr get-login-password \
                      --region ${AWS_REGION} |
                    docker login \
                      --username AWS \
                      --password-stdin ${ECR_REGISTRY}
                '''
            }
        }

        stage('Push Image') {
            steps {
                sh '''
                    docker push ${ECR_IMAGE}:${IMAGE_TAG}
                    
                '''
            }
        }

        stage('Deploy to ECS') {
            steps {
                script {

                    sh '''
                        aws ecs describe-task-definition \
                          --task-definition ${ECS_TASK_FAMILY} \
                          --region ${AWS_REGION} \
                          --query 'taskDefinition' \
                          --output json > task-definition.json
                    '''

                    sh '''
                       ECR_IMAGE="${ECR_IMAGE}" IMAGE_TAG="${IMAGE_TAG}" python3 - <<'PY'
import json
import os

with open("task-definition.json") as f:
    task = json.load(f)

image = f"{os.environ['ECR_IMAGE']}:{os.environ['IMAGE_TAG']}"

for container in task["containerDefinitions"]:
    if container["name"] == "backend":
        container["image"] = image

for key in [
    "taskDefinitionArn",
    "revision",
    "status",
    "requiresAttributes",
    "compatibilities",
    "registeredAt",
    "registeredBy"
]:
    task.pop(key, None)

with open("new-task-definition.json", "w") as f:
    json.dump(task, f)
PY
                    '''

                    sh '''
                        aws ecs register-task-definition \
                          --cli-input-json file://new-task-definition.json \
                          --region ${AWS_REGION} \
                          --query 'taskDefinition.taskDefinitionArn' \
                          --output text > new-task-definition-arn
                    '''

                    script {
                        env.NEW_TASK_DEFINITION = sh(
                            script: 'cat new-task-definition-arn',
                            returnStdout: true
                        ).trim()
                    }

                    echo "New task definition: ${NEW_TASK_DEFINITION}"

                    sh '''
                        aws ecs update-service \
                          --cluster ${ECS_CLUSTER} \
                          --service ${ECS_SERVICE} \
                          --task-definition ${NEW_TASK_DEFINITION} \
                          --region ${AWS_REGION}
                    '''
                }
            }
        }

        stage('Wait for ECS Stability') {
            steps {
                sh '''
                    aws ecs wait services-stable \
                      --cluster ${ECS_CLUSTER} \
                      --services ${ECS_SERVICE} \
                      --region ${AWS_REGION}
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    aws ecs describe-services \
                      --cluster ${ECS_CLUSTER} \
                      --services ${ECS_SERVICE} \
                      --region ${AWS_REGION} \
                      --query 'services[0].[serviceName,status,desiredCount,runningCount]' \
                      --output table
                '''
            }
        }
    }

    post {
        success {
            echo "======================================"
            echo "Deployment successful!"
            echo "Image: ${ECR_IMAGE}:${IMAGE_TAG}"
            echo "ECS service: ${ECS_SERVICE}"
            echo "======================================"
        }

        failure {
            echo "Deployment failed. Check the Jenkins console output."
        }

        always {
            sh '''
                rm -f task-definition.json
                rm -f new-task-definition.json
                rm -f new-task-definition-arn
            '''
        }
    }
}
