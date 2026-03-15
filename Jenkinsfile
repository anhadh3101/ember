pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building....'
            }
        }
        stage('Test') {
            steps {
                dir('ember-ios') {
                    // Do a clean install in the ember-ios directory.
                    sh 'npm ci' 
                    // Run the test cases.
                    sh 'npm test -- --testPathPatterns="__tests__/" --ci'
                }
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
    post {
        always {
            junit 'ember-ios/junit.xml'
        }
    }
}