import { supabase } from './supabase-client.js';

let allData = {};

export async function loadStockTakeData() {
  const searchBtn = document.getElementById('search-btn');
  searchBtn.addEventListener('click', displayData);

  const morningTable = document.querySelector('.table-wrapper:first-child');
  const afternoonTable = document.querySelector('.table-wrapper:last-child');
  morningTable.style.display = 'none';
  afternoonTable.style.display = 'none';

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
  } catch (error) {
    console.error('Failed to load stock take data:', error);
    const morningTbody = document.getElementById('morning-table-body');
    morningTbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading data: ${error.message}</td></tr>`;
    morningTable.style.display = 'block';
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
    const morningTbody = document.getElementById('morning-table-body');
    const afternoonTbody = document.getElementById('afternoon-table-body');
    morningTbody.innerHTML = `<tr><td colspan="4" class="text-center">No data found for the selected coldroom.</td></tr>`;
    afternoonTbody.innerHTML = '';
    const morningTable = document.querySelector('.table-wrapper:first-child');
    const afternoonTable = document.querySelector('.table-wrapper:last-child');
    morningTable.style.display = 'block';
    afternoonTable.style.display = 'none';
    return;
  }

  const filteredData = tableData.slice(1).filter(row => {
    if (!row[0]) {
      return false;
    }
    return row[0] === formattedDate;
  });

  const morningData = filteredData.filter(row => {
    if (!row[1]) {
      return false;
    }
    const time = row[1].split(':');
    const hour = parseInt(time[0], 10);
    return hour < 12;
  });

  const afternoonData = filteredData.filter(row => {
    if (!row[1]) {
      return false;
    }
    const time = row[1].split(':');
    const hour = parseInt(time[0], 10);
    return hour >= 12;
  });

  const morningTbody = document.getElementById('morning-table-body');
  morningTbody.innerHTML = '';
  const afternoonTbody = document.getElementById('afternoon-table-body');
  afternoonTbody.innerHTML = '';

  const morningTable = document.querySelector('.table-wrapper:first-child');
  const afternoonTable = document.querySelector('.table-wrapper:last-child');
  morningTable.style.display = 'block';
  afternoonTable.style.display = 'block';

  if (morningData.length === 0) {
    morningTbody.innerHTML = `<tr><td colspan="4" class="text-center">No data found for the morning.</td></tr>`;
  } else {
    morningData.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row[3] || ''}</td>
        <td>${row[4] || ''}</td>
        <td>${row[5] || ''}</td>
        <td>${row[7] || ''}</td>
      `;
      morningTbody.appendChild(tr);
    });
  }

  if (afternoonData.length === 0) {
    afternoonTbody.innerHTML = `<tr><td colspan="4" class="text-center">No data found for the afternoon.</td></tr>`;
  } else {
    afternoonData.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row[3] || ''}</td>
        <td>${row[4] || ''}</td>
        <td>${row[5] || ''}</td>
        <td>${row[7] || ''}</td>
      `;
      afternoonTbody.appendChild(tr);
    });
  }
}
