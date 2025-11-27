import { database } from "./firebase.mjs";
import { storage } from "./firebase.mjs";
import { ref, push, set, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

/**
 * Adiciona um novo projeto ao database
 * @param {Object} projectData - Dados do projeto
 * @param {string} projectData.name - Nome da obra
 * @param {string} projectData.address - Endereço
 * @param {string} projectData.startDate - Data de início (YYYY-MM-DD)
 * @param {string} projectData.endDate - Data de fim (YYYY-MM-DD)
 * @param {Array} projectData.operators - Array de IDs dos operadores
 * @param {Object} projectData.client - Dados do cliente
 * @param {string} projectData.client.name - Nome do cliente
 * @param {string} projectData.client.document - CNPJ/CPF
 * @param {string} projectData.client.email - Email
 * @param {string} projectData.client.whatsapp - WhatsApp
 * @param {string} managerId - ID do gerente que está criando o projeto
 * @returns {Promise<string>} - ID do projeto criado
 */
import { viewOperator as vo } from "./gerente.mjs";

let operatorList = [];
document.addEventListener("DOMContentLoaded", () => {
    const botaoSalvar = document.querySelector("#submitSalvar"); // botão do topo “Salvar”
    botaoSalvar.addEventListener("click", () => {
        // Lets obtidas dos inputs
        let nomeObra = document.getElementById("nomedaobra").value;
        let localizacao = document.getElementById("local").value;
        let descricao = document.getElementById("descricao").value;
        let dataInicial = document.getElementById("datainicial").value;
        let dataFinal = document.getElementById("datafinal").value;
        let nomeCliente = document.getElementById("nomeCliente").value;
        let cpfCnpjCliente = document.getElementById("cpfcnpjcliente").value;
        let emailCliente = document.getElementById("emailcliente").value;
        let whatsappCliente = document.getElementById("whatsappcliente").value;
        let MngrID = 0;

        operatorList = vo();

        console.log("iniciando envio");
        // Aqui você usa as variáveis let como precisar
        // ... Consideramos o manager ID como operador 0 por enquanto
        addProject({
            cliente: nomeCliente,
            obra: nomeObra,
            localizacao: localizacao,
            descricao: descricao,
            email: emailCliente,
            whatsappCliente: whatsappCliente,
            cpfCnpjCliente: cpfCnpjCliente,
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            managerId: MngrID,
        }, 0);
    });
});

async function addProject(projectData, managerId) {
    // Cria uma referência para a lista de projetos e gera uma nova chave
    const projectsRef = ref(database, 'projects');
    const newProjectRef = push(projectsRef);
    const projectId = newProjectRef.key;

    const project = {
        ...projectData,
        createdBy: managerId,
        createdAt: new Date().toISOString()
    };

    await set(newProjectRef, project);
    return projectId;
}

/**
 * Busca todos os projetos de um operador
 * @param {string} operatorId - ID do operador
 * @returns {Promise<Array>} - Array de projetos
 */
async function getOperatorProjects(operatorId) {
    const projectsRef = ref(database, 'projects');
    const snapshot = await get(projectsRef);

    const projects = [];
    snapshot.forEach((childSnapshot) => {
        const project = childSnapshot.val();
        if (project.operators && project.operators.includes(operatorId)) {
            projects.push({
                id: childSnapshot.key,
                ...project
            });
        }
    });

    return projects;
}

/**
 * Faz upload de uma imagem para o Storage e retorna a URL
 * @param {File} imageFile - Arquivo de imagem
 * @param {string} projectId - ID do projeto
 * @returns {Promise<string>} - URL da imagem
 */
async function uploadImage(imageFile, projectId) {
    // Cria uma referência para o arquivo no Storage
    const imageRef = storageRef(storage, `projectUpdates/${projectId}/${Date.now()}_${imageFile.name}`);

    // Faz o upload
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}

/**
 * Adiciona uma atualização (mensagem) ao projeto
 * @param {string} projectId - ID do projeto
 * @param {string} operatorId - ID do operador
 * @param {string} operatorName - Nome do operador
 * @param {string} message - Mensagem de texto (opcional)
 * @param {File} [imageFile] - Arquivo de imagem (opcional)
 * @returns {Promise<string>} - ID da atualização
 */

const sendMsgBt = document.getElementById("sendMessageBtOperator");
//depois tem que adaptar essa função para ver se teve foto enviada ou n

async function addProjectUpdate(projectId, operatorId, operatorName, message, imageFile) {
    let imageUrl = null;

    // Se há imagem, faz o upload
    if (imageFile) {
        imageUrl = await uploadImage(imageFile, projectId);
    }

    const updatesRef = ref(database, 'projectUpdates');
    const newUpdateRef = push(updatesRef);
    const updateId = newUpdateRef.key;

    const updateData = {
        projectId,
        operatorId,
        operatorName,
        message: message || '',
        imageUrl,
        timestamp: new Date().toISOString()
    };

    await set(newUpdateRef, updateData);
    return updateId;
}

/**
 * Busca todas as atualizações de um projeto
 * @param {string} projectId - ID do projeto
 * @returns {Promise<Array>} - Array de atualizações
 */
async function getProjectUpdates(projectId) {
    const updatesRef = ref(database, 'projectUpdates');
    const snapshot = await get(updatesRef);

    const updates = [];
    snapshot.forEach((childSnapshot) => {
        const update = childSnapshot.val();
        if (update.projectId === projectId) {
            updates.push({
                id: childSnapshot.key,
                ...update
            });
        }
    });

    // Ordena por timestamp (mais recente primeiro)
    updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return updates;
}

/**
 * Adiciona uma avaliação do cliente
 * @param {string} projectId - ID do projeto
 * @param {string} clientName - Nome do cliente
 * @param {string} projectName - Nome do projeto
 * @param {number} rating - Nota (ex: 1 a 5)
 * @param {string} comments - Comentários do cliente
 * @returns {Promise<string>} - ID da avaliação
 */
async function addReview(projectId, clientName, projectName, rating, comments) {
    const reviewsRef = ref(database, 'reviews');
    const newReviewRef = push(reviewsRef);
    const reviewId = newReviewRef.key;

    const reviewData = {
        projectId,
        clientName,
        projectName,
        rating,
        comments,
        createdAt: new Date().toISOString()
    };

    await set(newReviewRef, reviewData);
    return reviewId;
}