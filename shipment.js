export function loadShipmentPage() {
    const tabs = document.querySelectorAll('.shipment-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            openTab(event, event.currentTarget.dataset.tab);
        });
    });
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("shipment-tab");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active-tab", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active-tab";
}
