// app.js

// >>>>>> PASTIKAN MENGGANTI URL DI SINI DENGAN URL API BARU ANDA <<<<<<
const API_URL = 'https://script.google.com/macros/s/AKfycbxNMWIgO21GEd7P5K7EH7rMMWZoTshNEkSByfGOntbboS6YiamzjqjLYZ0dtZijRlgE/exec'; 

// Elemen DOM
const dataGrid = document.getElementById('data-section');
const filterSelect = document.getElementById('filter-select');
const metadataSelect = document.getElementById('metadata-select');
const metadataContent = document.getElementById('metadata-content');
const navLinks = document.querySelectorAll('nav a, .btn'); 
let allData = []; 

// --- FUNGSI 1: KONTROL TAMPILAN NAVIGASI ---
function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- FUNGSI 2: MEMBUAT CHART DENGAN GOOGLE CHARTS ---
function drawChart(indicatorName, historyData) {
    const chartDataArray = [['Tahun', indicatorName]];
    historyData.forEach(item => {
        // Konversi Nilai ke float
        chartDataArray.push([String(item.Tahun), parseFloat(String(item.Nilai).replace(',', '.'))]);
    });
    
    if (chartDataArray.length <= 1) return '<div class="no-chart-data">Data historis tidak cukup untuk grafik.</div>';

    const data = google.visualization.arrayToDataTable(chartDataArray);

    const chartId = `chart-${indicatorName.replace(/\s/g, '-')}`;
    
    // Gambar chart setelah memastikan elemen DOM tersedia
    setTimeout(() => {
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            const chart = new google.visualization.LineChart(chartElement);
            const options = {
                hAxis: { title: 'Tahun', format: '0' },
                vAxis: { title: 'Nilai' },
                legend: { position: 'none' },
                pointSize: 5,
                tooltip: { isHtml: true },
                chartArea: { left: 40, top: 20, right: 10, bottom: 30 }
            };
            chart.draw(data, options);
        }
    }, 100); 

    return `<div id="${chartId}" style="width: 100%; height: 250px;"></div>`;
}

// --- FUNGSI 3: MEMBUAT KARTU DASHBOARD ---
function createCard(data) {
    const perubahanFloat = parseFloat(String(data.Perubahan).replace(',', '.') || 0);
    const isPositive = perubahanFloat > 0;
    const colorClass = isPositive ? 'green' : 'red';
    const arrowChar = isPositive ? '▲' : '▼';
    
    const changeText = `${arrowChar} ${Math.abs(perubahanFloat)}`;

    // Panggil fungsi chart
    const chartHtml = data.history && data.history.length > 0 && typeof google !== 'undefined'
        ? drawChart(data.Nama, data.history)
        : '<div class="no-chart-data">Memuat atau Data grafik tidak tersedia.</div>';
        
    // Gunakan kolom Deskripsi dari sheet Data sebagai insight singkat
    const shortDescription = data.Deskripsi || data.Insight || 'Insight tidak tersedia.';

    return `
        <div class="card">
            <h3 class="card-title">${data.Nama} <span style="font-size: 0.8em; color: #777;">(Tahun ${data.Tahun})</span></h3>
            <div class="main-value">
                <span class="value ${colorClass}">${data.Nilai || 'N/A'}</span>
            </div>
            <p class="change ${colorClass}">${changeText}</p>
            
            <div class="card-chart-container">
                ${chartHtml}
            </div>

            <p class="description">${shortDescription}</p>
        </div>
    `;
}

// --- FUNGSI 4: FILTER DASHBOARD ---
function handleFilterChange(event) {
    const filterValue = event.target.value;
    let filteredData = allData;

    if (filterValue === 'Positif') {
        filteredData = allData.filter(item => parseFloat(String(item.Perubahan).replace(',', '.') || 0) > 0);
    } else if (filterValue === 'Negatif') {
        filteredData = allData.filter(item => parseFloat(String(item.Perubahan).replace(',', '.') || 0) <= 0);
    }

    dataGrid.innerHTML = ''; 
    filteredData.forEach(item => {
        if (item.Nama && item.Nilai) { 
            dataGrid.innerHTML += createCard(item);
        }
    });
    if (filteredData.length === 0) {
        dataGrid.innerHTML = '<p>Tidak ada indikator yang sesuai dengan filter.</p>';
    }
}

// --- FUNGSI 5: METADATA DETAIL ---
function fillMetadataDropdown() {
    metadataSelect.innerHTML = '<option value="">Pilih Indikator...</option>';
    const indicatorNames = Array.from(new Set(allData.map(item => item.Nama)));
    
    indicatorNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        metadataSelect.appendChild(option);
    });
}

function handleMetadataSelect(event) {
    const indicatorName = event.target.value;
    const dataDetail = allData.find(item => item.Nama === indicatorName); 
    
    if (dataDetail && dataDetail.Indikator) { 
        metadataContent.innerHTML = `
            <h3>Metadata Detail: ${dataDetail.Indikator}</h3>
            <p><strong>Nilai Terkini (${dataDetail.Tahun}):</strong> ${dataDetail.Nilai || 'N/A'}</p>
            <p><strong>Perhitungan:</strong> ${dataDetail.Perhitungan || 'Tidak Tersedia'}</p>
            <p><strong>Sumber Indikator:</strong> ${dataDetail['Sumber Indikator'] || 'Tidak Tersedia'}</p>
            <hr style="margin: 15px 0;">
            
            <p style="white-space: pre-wrap; font-size: 0.95em;">
                <strong>Penjelasan (Definisi):</strong><br>
                ${dataDetail.Penjelasan || 'Tidak Tersedia'}
            </p>
            <p style="white-space: pre-wrap; font-size: 0.95em; margin-top: 15px;">
                <strong>Faktor-faktor yang Mempengaruhi:</strong><br>
                ${dataDetail['Faktor-faktor yang Mempengaruhi'] || 'Tidak Tersedia'}
            </p>
            <p style="white-space: pre-wrap; font-size: 0.95em; margin-top: 15px;">
                <strong>Dampak:</strong><br>
                ${dataDetail.Dampak || 'Tidak Tersedia'}
            </p>
            <p style="white-space: pre-wrap; font-size: 0.95em; margin-top: 15px;">
                <strong>Insight BPS:</strong><br>
                ${dataDetail.Insight || 'Tidak Tersedia'}
            </p>
        `;
    } else {
        metadataContent.innerHTML = `
            <h3>Pilih Indikator</h3>
            <p>Silakan pilih indikator dari *dropdown* di atas.</p>
        `;
    }
}


// --- FUNGSI 6: PENGAMBIL DATA UTAMA (FETCH) ---
async function fetchData() {
    try {
        dataGrid.innerHTML = '<p>Memuat data dari Google Sheets...</p>';
        const response = await fetch(API_URL);
        
        if (!response.ok) throw new Error(`Gagal ambil data. Status HTTP: ${response.status}`);
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`GAS Error: ${data.error}`);
        }

        allData = data.filter(item => item.Nama && item.Nilai); 
        
        handleFilterChange({ target: { value: 'all' } }); 
        fillMetadataDropdown(); 

    } catch (error) {
        dataGrid.innerHTML = `<p style="color: red;">Gagal memuat data! Error: ${error.message}</p>`;
        console.error("Fetch Data Error:", error);
    }
}


// --- EVENT LISTENERS ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.getAttribute('data-view');
        if (viewId) {
            showView(viewId);
            if (viewId === 'view-indikator' && typeof google !== 'undefined') {
                // Render ulang chart saat pindah ke view Indikator
                handleFilterChange({ target: { value: filterSelect.value } });
            }
        }
    });
});

filterSelect.addEventListener('change', handleFilterChange);
metadataSelect.addEventListener('change', handleMetadataSelect);


// Inisialisasi Tampilan Awal & Data
showView('view-home'); 
fetchData();