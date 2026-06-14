const statusDiv = document.getElementById('server-status');

async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:3636/api/health');
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK') {
      statusDiv.innerText = `Connect to Server successful: "${data.message}"`;
      statusDiv.style.color = 'green';
    }
  } catch (error) {
    statusDiv.innerText = 'Can not connect to Server Backend!';
    statusDiv.style.color = 'red';
    console.error('Error:', error);
  }
}

checkServerHealth();