const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function sendChatMessage(sessionId, message, activeModel = "jarvis") {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId, message, active_model: activeModel }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    return { reply: "Error connecting to the brain.", tool_used: false };
  }
}

export async function uploadImage(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', 'Describe this image in detail. Be concise but mention key elements.');

    const response = await fetch(`${API_URL}/vision`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    return { description: "Failed to analyze image." };
  }
}
