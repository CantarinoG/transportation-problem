const fs = require('fs');

const CELULA_HORIZONTAL = 0
const CELULA_VERTICAL = 1

class Celula {
    constructor(i, j, direcao, anterior = null) {
      this.i = i;
      this.j = j;
      this.direcao = direcao
      this.anterior = anterior;
    }
  }

function lerArquivo(caminho, callback) {
    /*
    Formato do arquivo:
    numLinhas
    numColunas
    c11;c12;c13;oferta1
    c21;c22;c23;oferta2
    c31;c32;c33;oferta3
    demanda1;demanda2;demanda3;-1
    */
    fs.readFile(caminho, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            callback(err, null);
            return;
        }
        let linhas = data.split('\n');
        let matriz = [];
        for (let i = 2; i < linhas.length; i++) {
            matriz[i - 2] = linhas[i].split(';').map(Number)
        }
        callback(null, matriz);
    });
}

function isBalanceado(matriz) {
    let numLinhas = matriz.length
    let numColunas = matriz[0].length
    let totalOferta = 0
    for(let i = 0; i < numLinhas - 1; i++) {
        totalOferta += matriz[i][matriz.length - 1];
    }
    let totalDemanda = 0
    for(let i = 0; i < numColunas - 1; i++) {
        totalDemanda += matriz[matriz.length - 1][i]
    }
    console.debug(`DEBUG: TotalOferta:${totalOferta} | TotalDemanda:${totalDemanda}`)
    if(totalDemanda == totalOferta) return true
    return false
}

function solucaoInicial(isBalanceado, matrizCustoOriginal) {
    const numRows = matrizCustoOriginal.length;
    const numCols = matrizCustoOriginal[0].length;
    const matrizCusto = new Array(numRows);
    for (let i = 0; i < numRows; i++) {
        matrizCusto[i] = new Array(numCols);
        for (let j = 0; j < numCols; j++) {
        matrizCusto[i][j] = matrizCustoOriginal[i][j];
        }
    }

    console.debug(`DEBUG: isBalanceado:${isBalanceado}`)
    if(isBalanceado) {
        let numLinhas = matrizCusto.length
        let numColunas = matrizCusto[0].length
        let listaCustos = []
        for(let i = 0; i < numLinhas - 1; i++) {
            for(let j = 0; j < numColunas - 1; j++) {
                listaCustos.push(matrizCusto[i][j])
            }
        }
        listaCustos.sort((a, b) => b - a);
        console.debug(`DEBUG: ListaCustos:${listaCustos}`)
        let matrizVariaveis = criarMatrizVazia(numLinhas - 1, numColunas - 1)
        console.debug(`DEBUG: MatrizVariaveis:`)
        console.debug(matrizVariaveis)
        for(let i = 0; i < listaCustos.length; i++) {
            let indices = acharIndices(matrizCusto, listaCustos[i])
            matrizCusto[indices.linha][indices.coluna] = 0
            if(matrizVariaveis[indices.linha][indices.coluna] === null) {
                let valorOferta = matrizCusto[indices.linha][numColunas - 1]
                let valorDemanda = matrizCusto[numLinhas - 1][indices.coluna]
                console.debug(`DEBUG: valorOferta:${valorOferta}; valorDemanda:${valorDemanda}`)
                if(valorOferta < valorDemanda) {
                    matrizVariaveis[indices.linha][indices.coluna] = valorOferta
                    matrizCusto[indices.linha][numColunas - 1] = 0
                    matrizCusto[numLinhas - 1][indices.coluna] -= valorOferta
                    for(let j = 0; j < numColunas - 1; j++) {
                        if(j == indices.coluna) {continue}
                        if(matrizVariaveis[indices.linha][j] === null) {matrizVariaveis[indices.linha][j] = 0}
                    }
                } else {
                    matrizVariaveis[indices.linha][indices.coluna] = valorDemanda
                    matrizCusto[numLinhas - 1][indices.coluna] = 0
                    matrizCusto[indices.linha][numColunas - 1] -= valorDemanda
                    for(let j = 0; j < numLinhas - 1; j++) {
                        if(j == indices.linhas) {continue}
                        if(matrizVariaveis[j][indices.coluna] === null) {matrizVariaveis[j][indices.coluna] = 0}                        
                    }
                }
            }
            console.debug(`DEBUG: AcharIndices: (Iteração:${i}; Valor:${listaCustos[i]}; Linha:${indices.linha}; Coluna:${indices.coluna})`)
        }
        console.debug(`DEBUG: MatrizVariaveis:`)
        console.debug(matrizVariaveis)
        return matrizVariaveis
    }
}

function acharIndices(matriz, valor) {
    let indices = {linha:null, coluna:null}
    for (let i = 0; i < matriz.length; i++) {
        for (let j = 0; j < matriz[i].length; j++) {
            if (matriz[i][j] == valor) {
                indices.linha = i
                indices.coluna = j
            }
        }
    }
    return indices;
}

function criarMatrizVazia(linhas, colunas) {
    const matriz = [];
    for (let i = 0; i < linhas; i++) {
        matriz[i] = [];
        for (let j = 0; j < colunas; j++) {
            matriz[i][j] = null; 
        }
    }
    return matriz;
}

function testeOtimalidade(matrizVariavel, matrizCusto) {
    let numLinhas = matrizVariavel.length
    numColunas = matrizVariavel[0].length
    while(true){
        console.debug("DEBUG: Começando uma nova iteração!!!")
        let celulasAChecar = []
        for(let i = 0; i < numLinhas; i++) {
            for(let j = 0; j < numColunas; j++) {
                if(matrizVariavel[i][j] == 0) {
                    celulasAChecar.push({i, j})
                }
            }
        }
        console.debug(`DEBUG: Célular a checar: (${celulasAChecar[0].i},${celulasAChecar[0].j});(${celulasAChecar[1].i},${celulasAChecar[1].j});(${celulasAChecar[2].i},${celulasAChecar[2].j})...`)
        let caminhos = []
        let valoresCelulas = []
        
        for(let i = 0; i < celulasAChecar.length; i++) {
            let celula = new Celula(celulasAChecar[i].i, celulasAChecar[i].j, null)
            caminhos.push(acharCaminho(matrizVariavel, celula))
            console.debug(`DEBUG: Caminho do elemento de posição ${celulasAChecar[i].i}, ${celulasAChecar[i].j}:`)
            console.debug(caminhos[i])
            let valorCelula = 0
            for(let j = 0; j < Object.keys(caminhos[i]).length; j++) {
                if ((j % 2) == 0) {
                    valorCelula += matrizCusto[caminhos[i][j].i][caminhos[i][j].j]
                } else {
                    valorCelula -= matrizCusto[caminhos[i][j].i][caminhos[i][j].j]
                }
            }
            valoresCelulas.push({valorCelula, i: celulasAChecar[i].i, j: celulasAChecar[i].j})
            console.debug(`DEBUG: Valor da célula ${i}: ${valorCelula}`)
        }
        console.debug("DEBUG: Valores das células:", valoresCelulas)
        let algumValorNegativo = false
        for(let i = 0; i < valoresCelulas.length; i++) {
            if (valoresCelulas[i].valorCelula < 0){
                algumValorNegativo = true
            }
        }
        if (!algumValorNegativo) {
            return matrizVariavel
        }
        let valorASerSubstituido = Infinity
        let celulaASerColocada = -1
        for(let i = 0; i < valoresCelulas.length; i++) {
            if (valoresCelulas[i].valorCelula < valorASerSubstituido) {
                valorASerSubstituido = valoresCelulas[i].valorCelula
                celulaASerColocada = i
            }
        }
        console.debug(`DEBUG: Célula a ser colocada:`)
        console.debug(caminhos[celulaASerColocada])
        valorASerSubstituido = Infinity
        for(let i = 0; i < Object.keys(caminhos[celulaASerColocada]).length; i++) {
            if((i % 2) != 0 && matrizVariavel[caminhos[celulaASerColocada][i].i][caminhos[celulaASerColocada][i].j] < valorASerSubstituido) {
                console.log(caminhos[celulaASerColocada][i])
                valorASerSubstituido = matrizVariavel[caminhos[celulaASerColocada][i].i][caminhos[celulaASerColocada][i].j]
            }
        }
        console.debug(`DEBUG: Valor a ser colocado: ${valorASerSubstituido}`)
        console.debug(`DEBUG: Matriz de variáveis antes: `)
        console.debug(matrizVariavel)
        for(let i = 0; i < Object.keys(caminhos[celulaASerColocada]).length; i++) {
            if((i % 2) == 0 ) {
                matrizVariavel[caminhos[celulaASerColocada][i].i][caminhos[celulaASerColocada][i].j] += valorASerSubstituido
            } else {
                matrizVariavel[caminhos[celulaASerColocada][i].i][caminhos[celulaASerColocada][i].j] -= valorASerSubstituido
            }
        }
        console.debug(`DEBUG: Matriz de variáveis depois: `)
        console.debug(matrizVariavel)
    }
}

function acharCaminho(matrizVariavel, celula) {
    let iInicial = celula.i
    let jInicial = celula.j
    let numLinhas = matrizVariavel.length
    let numColunas = matrizVariavel[0].length
    let celulasAAbrir = []

    for(let i = 0; i < numLinhas; i++) {
        if(i != iInicial && matrizVariavel[i][jInicial] != 0) {
            celulasAAbrir.push(new Celula(i, jInicial, CELULA_HORIZONTAL, celula))
        }
    }
    for(let j = 0; j < numColunas; j++) {
        if(j != jInicial && matrizVariavel[iInicial][j] != 0) {
            celulasAAbrir.push(new Celula(iInicial, j, CELULA_VERTICAL, celula))
        }
    }

    while(true) {
        if(celulasAAbrir.length <= 0) { break }
        let celulaAtual = celulasAAbrir.shift()
        if(celulaAtual.i == iInicial && celulaAtual.j == jInicial) {
            //Chegou novamente na célula inicial
            let celula = celulaAtual
            const caminho = []
            while(celula.anterior !== null) {
                caminho.push({i: celula.i, j: celula.j})
                celula = celula.anterior
            }
            return caminho
        }
        if(celulaAtual.direcao == CELULA_HORIZONTAL){
            for(let j = 0; j < numColunas; j++) {
                if((j != celulaAtual.j && matrizVariavel[celulaAtual.i][j] != 0) || (celulaAtual.i == iInicial && j == jInicial)) {
                    celulasAAbrir.push(new Celula(celulaAtual.i, j, CELULA_VERTICAL, celulaAtual))
                }
            }
        } else if(celulaAtual.direcao == CELULA_VERTICAL) {
            for(let i = 0; i < numLinhas; i++) {
                if((i != celulaAtual.i && matrizVariavel[i][celulaAtual.j] != 0) || (i == iInicial && celulaAtual.j == jInicial)) {
                    celulasAAbrir.push(new Celula(i, celulaAtual.j, CELULA_HORIZONTAL, celulaAtual))
                }
            }
        } 
    }
    return
}

function main() {
    lerArquivo("./input.txt", (err, matrizCusto) => {
        if (err) {
            console.error(err)
        } else {
            console.debug(`DEBUG: Matriz de custo:`)
            console.debug(matrizCusto)
            let matrizVariavel = solucaoInicial(isBalanceado(matrizCusto), matrizCusto)
            let matrizOtima = testeOtimalidade(matrizVariavel, matrizCusto)
            console.log("\n\n\n\n\n\n\n\n\n A matriz ótima: ")
            console.log(matrizOtima)
        }
    });
}
main();