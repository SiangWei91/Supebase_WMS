import { supabase } from './supabase-client.js';

let allData = {};

export async function loadStockTakeData() {
  const datePicker = document.getElementById('date-picker');
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  const year = today.getFullYear();
  datePicker.value = `${day}/${month}/${year}`;

  const searchBtn = document.getElementById('search-btn');
  searchBtn.addEventListener('click', displayData);

  const morningTable = document.getElementById('morning-wrapper');
  const afternoonTable = document.getElementById('afternoon-wrapper');
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
    const morningTable = document.getElementById('morning-wrapper');
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

  const dateParts = selectedDate.split('/');
  const selectedDateObject = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
  const formattedDate = selectedDate;

  const tableData = allData[coldroom];
  if (!tableData) {
    const morningTbody = document.getElementById('morning-table-body');
    const afternoonTbody = document.getElementById('afternoon-table-body');
    morningTbody.innerHTML = `<tr><td colspan="4" class="text-center">No data found for the selected coldroom.</td></tr>`;
    afternoonTbody.innerHTML = '';
    const morningTable = document.getElementById('morning-wrapper');
    const afternoonTable = document.getElementById('afternoon-wrapper');
    morningTable.style.display = 'block';
    afternoonTable.style.display = 'none';
    return;
  }

  const filteredData = tableData.slice(1).filter(row => {
    if (!row[0]) {
      return false;
    }
    return row[0] === formattedDate;
  }).sort((a, b) => {
    if (a[2] < b[2]) {
      return -1;
    }
    if (a[2] > b[2]) {
      return 1;
    }
    return 0;
  });

  const morningTable = document.getElementById('morning-wrapper');
  const afternoonTable = document.getElementById('afternoon-wrapper');

  morningTable.style.display = 'block';
  afternoonTable.style.display = 'block';

  if (coldroom === 'B15') {
    const previousDateObject = new Date(selectedDateObject);
    previousDateObject.setDate(previousDateObject.getDate() - 1);
    const formattedPreviousDate = `${(previousDateObject.getDate()).toString().padStart(2, '0')}/${(previousDateObject.getMonth() + 1).toString().padStart(2, '0')}/${previousDateObject.getFullYear()}`;

    const previousDayData = tableData.slice(1).filter(row => {
      if (!row[0]) {
        return false;
      }
      return row[0] === formattedPreviousDate;
    }).sort((a, b) => {
      if (a[2] < b[2]) {
        return -1;
      }
      if (a[2] > b[2]) {
        return 1;
      }
      return 0;
    });

    const selectedDayData = filteredData;

    const morningTbody = document.getElementById('morning-table-body');
    morningTbody.innerHTML = '';
    const afternoonTbody = document.getElementById('afternoon-table-body');
    afternoonTbody.innerHTML = '';

    document.querySelector('#morning-wrapper h2').textContent = formattedPreviousDate;
    document.querySelector('#afternoon-wrapper h2').textContent = formattedDate;
    document.querySelector('#afternoon-wrapper .comparison-header').style.display = '';

    if (previousDayData.length === 0) {
        morningTbody.innerHTML = `<tr><td colspan="4" class="text-center">No data found for ${formattedPreviousDate}</td></tr>`;
    } else {
        previousDayData.forEach(row => {
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

    if (selectedDayData.length === 0) {
        afternoonTbody.innerHTML = `<tr><td colspan="5" class="text-center">No data found for ${formattedDate}</td></tr>`;
    } else {
        const previousDayItems = {};
        previousDayData.forEach(row => {
            previousDayItems[row[2]] = { ctn: parseInt(row[5], 10) || 0 };
        });

        selectedDayData.forEach(row => {
            const itemCode = row[2];
            const previousDayItem = previousDayItems[itemCode];
            let ctnDiff = 0;
            if (previousDayItem) {
                const selectedDayCtn = parseInt(row[5], 10) || 0;
                ctnDiff = selectedDayCtn - previousDayItem.ctn;
            }

            const ctnColor = ctnDiff > 0 ? 'green' : (ctnDiff < 0 ? 'red' : 'black');
            const ctnSign = ctnDiff > 0 ? '+' : '';
            const ctnDisplay = ctnDiff === 0 ? '' : `${ctnSign}${ctnDiff}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row[3] || ''}</td>
                <td>${row[4] || ''}</td>
                <td>${row[5] || ''}</td>
                <td>${row[7] || ''}</td>
                <td style="color: ${ctnColor}; background-color: #e0f7ff;">${ctnDisplay}</td>
            `;
            afternoonTbody.appendChild(tr);
        });
    }

    return;
  }

  document.querySelector('#morning-wrapper h2').textContent = 'Morning';
  document.querySelector('#afternoon-wrapper h2').textContent = 'Afternoon';
  document.querySelector('#afternoon-wrapper .comparison-header').style.display = '';

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
    afternoonTbody.innerHTML = `<tr><td colspan="5" class="text-center">No data found for the afternoon.</td></tr>`;
  } else {
    const morningItems = {};
    morningData.forEach(row => {
      morningItems[row[2]] = { ctn: parseInt(row[5], 10) || 0 };
    });

    afternoonData.forEach(row => {
      const itemCode = row[2];
      const morningItem = morningItems[itemCode];
      let ctnDiff = 0;
      if (morningItem) {
        const afternoonCtn = parseInt(row[5], 10) || 0;
        ctnDiff = afternoonCtn - morningItem.ctn;
      }

      const ctnColor = ctnDiff > 0 ? 'green' : (ctnDiff < 0 ? 'red' : 'black');
      const ctnSign = ctnDiff > 0 ? '+' : '';
      const ctnDisplay = ctnDiff === 0 ? '' : `${ctnSign}${ctnDiff}`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row[3] || ''}</td>
        <td>${row[4] || ''}</td>
        <td>${row[5] || ''}</td>
        <td>${row[7] || ''}</td>
        <td style="color: ${ctnColor}; background-color: #e0f7ff;">${ctnDisplay}</td>
      `;
      afternoonTbody.appendChild(tr);
    });
  }
}
