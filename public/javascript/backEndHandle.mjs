import { database } from "./firebase.mjs";
import { storage } from "./firebase.mjs";
import { ref, push, set, orderByChild, equalTo, get, remove, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
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
    const listaOperators = document.getElementById("operatorList");
    if (listaOperators != null) {
            MAKEOPERATORSDOM(listaOperators);
        }
    
    //isso aq vai ser um problema, você vai ter que sempre colocar isso aq em cima de event listner, pra validar
    if (botaoSalvar != null) {
        
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
            operadores: operatorList,
            dataInicial: dataInicial,
            dataFinal: dataFinal,
            managerId: MngrID,
        }, 0);
    });
    }
});

async function MAKEOPERATORSDOM(OperadoresDiv) {
    
        const Operadorespresentes = await buscarTodosOperadores(); // todos os operadores possiveis
        console.log(Operadorespresentes);
        
        for (let i = 0; i < Operadorespresentes.length; i++) {
            const element = Operadorespresentes[i];
            //console.log(element);
            
        OperadoresDiv.innerHTML += `
        
<div id="${element.nome}" class=" operatorInList flex cursor-pointer items-center gap-4 rounded-lg bg-black p-3 min-h-[72px] justify-between transition-all hover:bg-neutral-900 active:bg-neutral-800">
  <div class="flex items-center gap-4">
    
    <div class="flex flex-col justify-center">
      <p class="text-white text-base font-medium leading-normal line-clamp-1">
        ${element.nome}
      </p>
      
    </div>
  </div>
  <div class="shrink-0">
    <div class="text-white flex size-7 items-center justify-center">
      <span class="material-symbols-outlined">chevron_right</span>
    </div>
  </div>
</div>
        `
        }
const loading = document.getElementById("loading");
loading.remove();
}

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
    console.log('project data: ', project);
    /*const todosOperadores = await buscarTodosOperadores();
    console.log('Operadores cadastrados:', todosOperadores);*/
    
    for (const key in projectData) {
        if (key != "operadores") {
            continue;
        }
        
        const element = projectData[key];
        console.log("Elementos operadores", element);

        for (let i = 0; i < element.length+1; i++) {
            const elementZ = element[i];
            console.log("tentando criar ", elementZ);
            
    // Verificar se operador existe ou criar novo
    const resultado = await verificarOuCriarOperador({
        id: elementZ,
        nome: elementZ,
    });
    
        }
    
    }
    
    await set(newProjectRef, project);
    return projectId;
}
// operadores.mjs
import { child } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

/**
 * Verifica se um operador existe e cria se não existir
 * @param {Object} operadorData - Dados do operador
 * @param {string} operadorData.id - ID único do operador
 * @param {string} operadorData.nome - Nome do operador
 * @param {string} operadorData.email - Email do operador
 * @param {string} operadorData.telefone - Telefone do operador
 * @returns {Promise<Object>} - Resultado da operação
 */
async function verificarOuCriarOperador(operadorData) {
    try {
        const operadorRef = ref(database, `operadores/${operadorData.id}`);
        
        // Verifica se o operador já existe [citation:9]
        const snapshot = await get(operadorRef);
        
        if (snapshot.exists()) {
            console.log(`Operador ${operadorData.nome} já existe no banco de dados`);
            return { 
                success: true, 
                exists: true, 
                data: snapshot.val(),
                message: 'Operador já existente'
            };
        } else {
            // Cria o novo operador [citation:7]
            const dadosOperador = {
                ...operadorData,
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
                ativo: true
            };
            
            await set(operadorRef, dadosOperador);
            console.log(`Novo operador ${operadorData.nome} criado com sucesso`);
            
            return { 
                success: true, 
                exists: false, 
                data: dadosOperador,
                message: 'Operador criado com sucesso'
            };
        }
    } catch (error) {
        console.error('Erro ao verificar/criar operador:', error);
        return { 
            success: false, 
            error: error.message,
            message: 'Erro ao processar operador'
        };
    }
}

/**
 * Busca todos os operadores cadastrados
 * @returns {Promise<Array>} - Lista de operadores
 */
async function buscarTodosOperadores() {
    try {
        const operadoresRef = ref(database, 'operadores');
        const snapshot = await get(operadoresRef);
        
        if (snapshot.exists()) {
            const operadores = [];
            snapshot.forEach((childSnapshot) => {
                operadores.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return operadores;
        } else {
            console.log('Nenhum operador encontrado no banco de dados');
            return [];
        }
    } catch (error) {
        console.error('Erro ao buscar operadores:', error);
        throw error;
    }
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

async function readAllData(collection) {
            try {
                const snapshot = await database.ref(collection).once('value');
                const data = snapshot.val();
                
                console.log(`✅ Dados lidos da coleção: ${collection}`);
                return {
                    success: true,
                    data: data || {}
                };
                
            } catch (error) {
                console.error('❌ Erro ao ler dados:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
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


/**
 * Adiciona um projeto ao operador se ele não existir no array
 * @param {string} operadorId - ID do operador
 * @param {string} projetoId - ID do projeto
 * @param {Object} projetoData - Dados do projeto
 * @returns {Promise<Object>} - Resultado da operação
 */
async function adicionarProjetoAoOperador(operadorId, projetoId, projetoData) {
    try {
        const operadorRef = ref(database, `operadores/${operadorId}`);
        const snapshot = await get(operadorRef);
        
        if (!snapshot.exists()) {
            return {
                success: false,
                error: 'Operador não encontrado',
                message: `Operador ${operadorId} não existe no banco de dados`
            };
        }

        const operador = snapshot.val();
        
        // Inicializa o array de projetos se não existir
        if (!operador.projetos) {
            operador.projetos = {};
        }

        // Verifica se o projeto já existe
        if (operador.projetos[projetoId]) {
            return {
                success: true,
                exists: true,
                message: 'Projeto já está associado ao operador'
            };
        }

        // Adiciona o projeto ao operador
        const projetoInfo = {
            id: projetoId,
            nome: projetoData.nome || 'Projeto sem nome',
            dataAssociacao: new Date().toISOString(),
            status: 'ativo',
            ...projetoData
        };

        // Atualiza apenas o projeto específico
        const updates = {};
        updates[`operadores/${operadorId}/projetos/${projetoId}`] = projetoInfo;

        await update(ref(database), updates);

        return {
            success: true,
            exists: false,
            data: projetoInfo,
            message: 'Projeto adicionado ao operador com sucesso'
        };

    } catch (error) {
        console.error('Erro ao adicionar projeto ao operador:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao adicionar projeto'
        };
    }
}

/**
 * Remove um projeto do operador (quando concluído)
 * @param {string} operadorId - ID do operador
 * @param {string} projetoId - ID do projeto
 * @returns {Promise<Object>} - Resultado da operação
 */
async function removerProjetoDoOperador(operadorId, projetoId) {
    try {
        const projetoRef = ref(database, `operadores/${operadorId}/projetos/${projetoId}`);
        const snapshot = await get(projetoRef);
        
        if (!snapshot.exists()) {
            return {
                success: false,
                error: 'Projeto não encontrado',
                message: `Projeto ${projetoId} não está associado ao operador ${operadorId}`
            };
        }

        // Remove o projeto do operador
        await remove(projetoRef);

        return {
            success: true,
            message: 'Projeto removido do operador com sucesso'
        };

    } catch (error) {
        console.error('Erro ao remover projeto do operador:', error);
        return {
            success: false,
            error: error.message,
            message: 'Erro ao remover projeto'
        };
    }
}

/**
 * Marca projeto como concluído (em vez de remover imediatamente)
 * @param {string} operadorId - ID do operador
 * @param {string} projetoId - ID do projeto
 * @returns {Promise<Object>} - Resultado da operação
 */
 async function marcarProjetoComoConcluido(operadorId, projetoId) {
    try {
        const projetoRef = ref(database, `operadores/${operadorId}/projetos/${projetoId}`);
        const snapshot = await get(projetoRef);
        
        if (!snapshot.exists()) {
            return {
                success: false,
                error: 'Projeto não encontrado'
            };
        }

        // Atualiza o status para concluído
        await update(projetoRef, {
            status: 'concluido',
            dataConclusao: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        return {
            success: true,
            message: 'Projeto marcado como concluído'
        };

    } catch (error) {
        console.error('Erro ao marcar projeto como concluído:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Busca todos os projetos de um operador
 * @param {string} operadorId - ID do operador
 * @returns {Promise<Array>} - Lista de projetos do operador
 */
 async function buscarProjetosDoOperador(operadorId) {
    try {
        const projetosRef = ref(database, `operadores/${operadorId}/projetos`);
        const snapshot = await get(projetosRef);
        
        if (snapshot.exists()) {
            const projetos = [];
            snapshot.forEach((childSnapshot) => {
                projetos.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            return projetos;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Erro ao buscar projetos do operador:', error);
        throw error;
    }
}

/**
 * Função completa: cria operador se não existir e associa projeto
 * @param {Object} operadorData - Dados do operador
 * @param {string} projetoId - ID do projeto
 * @param {Object} projetoData - Dados do projeto
 * @returns {Promise<Object>} - Resultado completo
 */
async function garantirOperadorEProjeto(operadorData, projetoId, projetoData) {
    try {
        // Importa a função do arquivo anterior
        const { verificarOuCriarOperador } = await import('./operadores.mjs');
        
        // 1. Verifica/Cria operador
        const resultadoOperador = await verificarOuCriarOperador(operadorData);
        
        if (!resultadoOperador.success) {
            return resultadoOperador;
        }

        // 2. Associa projeto ao operador
        const resultadoProjeto = await adicionarProjetoAoOperador(
            operadorData.id, 
            projetoId, 
            projetoData
        );

        return {
            operador: resultadoOperador,
            projeto: resultadoProjeto,
            success: resultadoProjeto.success
        };

    } catch (error) {
        console.error('Erro no processo completo:', error);
        return {
            success: false,
            error: error.message
        };
    }
}