import { supabase } from './supabase-client.js';

let allData = {};

export async function loadStockTakeData() {
  const searchBtn = document.getElementById('search-btn');
  searchBtn.addEventListener('click', displayData);

  const tbody = document.getElementById('stock-take-table-body');
  tbody.innerHTML = `<tr><td colspan="9" class="text-center">Loading data...</td></tr>`;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session.access_token;

    const response = await fetch('https://xnwjvhbkzrazluihnzhw.supabase.co/functions/v1/get-sheet-data', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText} - ${errorText}`);
    }
    allData = await response.json();

    if (allData.error) {
      throw new Error(allData.error);
    }
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">Please select a coldroom and date and click search.</td></tr>`;
  } catch (error) {
    console.error('Failed to load stock take data:', error);
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading data: ${error.message}</td></tr>`;
  }
}

function displayData() {
  const coldroom = document.getElementById('coldroom-select').value;
  const datePicker = document.getElementById('date-picker');
  const selectedDate = datePicker.value;

  if (!selectedDate) {
    alert('Please select a date.');
    return;
  }

  const selectedDateObject = new Date(selectedDate);
  const formattedDate = `${(selectedDateObject.getDate()).toString().padStart(2, '0')}/${(selectedDateObject.getMonth() + 1).toString().padStart(2, '0')}/${selectedDateObject.getFullYear()}`;

  const tableData = allData[coldroom];
  if (!tableData) {
    const tbody = document.getElementById('stock-take-table-body');
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">No data found for the selected coldroom.</td></tr>`;
    return;
  }

  const filteredData = tableData.slice(1).filter(row => {
    if (!row[0]) {
      return false;
    }
    return row[0] === formattedDate;
  });

  const tbody = document.getElementById('stock-take-table-body');
  tbody.innerHTML = '';

  if (filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">No data found for the selected date.</td></tr>`;
    return;
  }

  filteredData.forEach(row => {
    const tr = document.createElement('tr');
    for (let i = 0; i < 9; i++) {
      const td = document.createElement('td');
      td.textContent = row[i] || '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}
