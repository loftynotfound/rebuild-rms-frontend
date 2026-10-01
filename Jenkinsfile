// Jenkinsfile - Frontend (static build + nginx container) — versi Docker
// Strategi: Blue/Green via dua container bergantian, di-switch lewat nginx upstream
// Branch: Prod -> production, Test -> staging
//
// CATATAN: file ini dibuat mengikuti pola backend/Jenkinsfile yang sudah ada
// (belum ada di upload asli) — sesuaikan nama repo/env var dengan proyek Anda.

pipeline {
    agent {label 'docker'}

    environment {
        APP_NAME       = 'frontend-rms'
        SSH_CRED_ID    = 'jenkins-agent'
        REGISTRY_CRED  = 'docker-registry-cred'   // Username/Password credential
        REGISTRY       = 'registry.rusera.co.id'  // ganti sesuai registry Anda (bisa Docker Hub / GHCR / self-hosted)
        DOCKER_NETWORK = 'rms-rebuild'            // dibuat sekali di VPS, dipakai bareng backend, frontend, redis
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    stages {

        stage('Tentukan Environment') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.DEPLOY_ENV     = 'production'
                        env.REMOTE_HOST    = '76.13.198.101'
                        env.REMOTE_PORT    = '1818'
                        env.REMOTE_USER    = 'jenkins-agent'
                        env.STATE_DIR      = '/var/www/Rebuild-RMS/rebuild-rms-frontend_color'
                        env.PORT_BLUE      = '5001'
                        env.PORT_GREEN     = '5002'
                        env.API_BASE_URL   = 'https://backend-rebuild.rms.rusera.co.id/api'
                    } else if (env.BRANCH_NAME == 'testing') {
                        env.DEPLOY_ENV     = 'staging'
                        env.REMOTE_HOST    = '76.13.198.101'
                        env.REMOTE_PORT    = '1818'
                        env.REMOTE_USER    = 'jenkins-agent'
                        env.STATE_DIR      = '/var/www/Rebuild-RMS/rebuild-rms-frontend-stag_color'
                        env.PORT_BLUE      = '5003'
                        env.PORT_GREEN     = '5004'
                        env.API_BASE_URL   = 'https://backend-rebuild.rms.rusera.co.id/api'
                    } else {
                        error "Branch '${env.BRANCH_NAME}' tidak dikonfigurasi untuk deployment."
                    }
                    env.IMAGE_TAG = "${REGISTRY}/${APP_NAME}:${DEPLOY_ENV}-${BUILD_NUMBER}"
                    echo "Deploy branch ${env.BRANCH_NAME} -> ${env.DEPLOY_ENV}, image ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build & Push Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.REGISTRY_CRED, usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    sh '''
                        echo "$REG_PASS" | docker login "$REGISTRY" -u "$REG_USER" --password-stdin
                        docker build \
                            --build-arg API_BASE_URL="$API_BASE_URL" \
                            -t "$IMAGE_TAG" .
                        docker push "$IMAGE_TAG"
                    '''
                }
            }
        }

        stage('Deteksi Warna Aktif') {
            steps {
                sshagent(credentials: [env.SSH_CRED_ID]) {
                    script {
                        env.ACTIVE_COLOR = sh(
                            script: """
                                ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
                                'cat ${STATE_DIR}/active_color 2>/dev/null || echo none'
                            """,
                            returnStdout: true
                        ).trim()

                        if (env.ACTIVE_COLOR == 'blue') {
                            env.TARGET_COLOR = 'green'
                            env.TARGET_PORT  = env.PORT_GREEN
                        } else {
                            env.TARGET_COLOR = 'blue'
                            env.TARGET_PORT  = env.PORT_BLUE
                        }
                        echo "Aktif saat ini: ${env.ACTIVE_COLOR} -> Target deploy: ${env.TARGET_COLOR} (port ${env.TARGET_PORT})"
                    }
                }
            }
        }

        stage('Jalankan Container Target') {
            steps {
                sshagent(credentials: [env.SSH_CRED_ID]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} '
                            docker pull ${IMAGE_TAG}
                            docker rm -f ${APP_NAME}-${DEPLOY_ENV}-${TARGET_COLOR} 2>/dev/null || true
                            docker run -d \
                                --name ${APP_NAME}-${DEPLOY_ENV}-${TARGET_COLOR} \
                                --network ${DOCKER_NETWORK} \
                                --restart unless-stopped \
                                -p ${TARGET_PORT}:80 \
                                ${IMAGE_TAG}
                        '
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sshagent(credentials: [env.SSH_CRED_ID]) {
                    script {
                        def code = sh(
                            script: """
                                sleep 3
                                ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
                                'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${TARGET_PORT}/ --max-time 5'
                            """,
                            returnStdout: true
                        ).trim()

                        if (code != '200') {
                            sh """
                                ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
                                'docker logs --tail 50 ${APP_NAME}-${DEPLOY_ENV}-${TARGET_COLOR}'
                            """
                            error "Health check gagal di ${TARGET_COLOR} (HTTP ${code}). Container lama tetap melayani traffic."
                        }
                        echo "Health check sukses (HTTP ${code})"
                    }
                }
            }
        }

        stage('Switch Traffic (Blue/Green)') {
            steps {
                sshagent(credentials: [env.SSH_CRED_ID]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} '
                            echo ${TARGET_COLOR} | sudo tee ${STATE_DIR}/active_color > /dev/null
                            sudo ln -sfn /etc/nginx/snippets/frontend-${DEPLOY_ENV}-${TARGET_COLOR}.conf \
                                /etc/nginx/snippets/frontend-${DEPLOY_ENV}-active.conf
                            sudo nginx -t && sudo systemctl reload nginx
                        '
                    """
                }
            }
        }

        stage('Stop Container Lama') {
            steps {
                sshagent(credentials: [env.SSH_CRED_ID]) {
                    script {
                        def oldColor = (env.TARGET_COLOR == 'blue') ? 'green' : 'blue'
                        sh """
                            ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} '
                                sleep 5
                                docker stop ${APP_NAME}-${DEPLOY_ENV}-${oldColor} 2>/dev/null || true
                            '
                        """
                        // container lama sengaja tidak di-rm, supaya rollback tinggal "docker start" lagi
                    }
                }
            }
        }

        stage('Cleanup Image Lama') {
            steps {
                sshagent(credentials: [env.SSH_CRED_ID]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
                        'docker image prune -f --filter "until=72h"'
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deploy frontend ${env.DEPLOY_ENV} branch ${env.BRANCH_NAME} SUKSES -> warna aktif: ${env.TARGET_COLOR}"
        }
        failure {
            echo "Deploy frontend ${env.DEPLOY_ENV} GAGAL. Container lama (jika ada) tetap melayani traffic."
        }
    }
}
