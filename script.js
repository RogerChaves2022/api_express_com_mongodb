document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:8080/api/dados') // Faz uma solicitação para a rota que fornece os dados
        .then(response => response.json())
        .then(data => {
            // Renderiza o gráfico com os dados obtidos
            renderizarGrafico(data);
        })
        .catch(error => console.error('Erro ao obter os dados:', error));
});

function renderizarGrafico(data) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Quantidade',
                data: data.quantidades, // Corrigido para 'quantidades' em vez de 'values'
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false,
                        suggestedMin: -10, // Valor mínimo sugerido
                        suggestedMax: 20 // Valor máximo sugerido
                    }
                }]
            }
        }
    });
}