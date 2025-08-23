// server action to fetch chat sessions using userId
export async function fetchChatSessions(userId: string, featureType?: string) {
  try {
    console.log("BACKEND API URL for chat sessions: ", process.env.BACKEND_API_URL)

    const url = new URL('/api/chat/', process.env.BACKEND_API_URL || 'http://localhost:8000');
    
    console.log("REQUESTED URL for chat sessions: ", url)
    
    if (featureType) {
      url.searchParams.append('feature_type', featureType);
    }
    url.searchParams.append('limit', '50');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'user-id': userId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    throw error;
  }
}

// server action to fetch first message of a chat session using userId
export async function fetchFirstMessage(sessionId: string, userId: string) {
  try {
    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://localhost:8000'}/api/chat/${sessionId}/messages?limit=1`, {
      method: 'GET',
      headers: {
        'user-id': userId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching first message:', error);
    throw error;
  }
}
