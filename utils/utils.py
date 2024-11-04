import aiohttp
import logging

async def check_stream_status(client_id, access_token, broadcaster):
    # Check if the broadcaster's stream is live
    headers = {
        'Client-ID': client_id,
        'Authorization': f'Bearer {access_token}'
    }
    url = f'https://api.twitch.tv/helix/streams?user_login={broadcaster}'
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return len(data['data']) > 0
                else:
                    logging.error(f"Error checking stream status: HTTP {response.status}")
                    return None
    except Exception as e:
        logging.error(f"Error checking stream status: {str(e)}")
        return None