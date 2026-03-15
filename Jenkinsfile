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
            junit allowEmptyResults: true, testResults: 'ember-ios/junit.xml'
        }
        success {
            step([$class: 'GitHubCommitStatusSetter',
                reposSource: [$class: 'ManuallyEnteredRepositorySource', url: 'https://github.com/anhadh3101/ember'],
                contextSource: [$class: 'ManuallyEnteredCommitContextSource', context: 'ci/jenkins/tests'],
                statusResultSource: [$class: 'ConditionalStatusResultSource', results: [[$class: 'AnyBuildResult', message: 'Tests passed', state: 'SUCCESS']]]
            ])
        }
        failure {
            step([$class: 'GitHubCommitStatusSetter',
                reposSource: [$class: 'ManuallyEnteredRepositorySource', url: 'https://github.com/anhadh3101/ember'],
                contextSource: [$class: 'ManuallyEnteredCommitContextSource', context: 'ci/jenkins/tests'],
                statusResultSource: [$class: 'ConditionalStatusResultSource', results: [[$class: 'AnyBuildResult', message: 'Tests failed', state: 'FAILURE']]]
            ])
        }
    }
}