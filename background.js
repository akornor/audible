const getAPIKey = async () => {
  const response = await fetch(chrome.runtime.getURL('./config.json'))
  const { API_KEY } = await response.json()
  return API_KEY
}

const updateBadgeText = text => {
  chrome.browserAction.setBadgeText({
    text,
  })
}

const handleBrowserActionClick = tab => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.executeScript(
      tabs[0].id,
      { code: 'window.getSelection().toString()' },
      async selection => {
        try {
          if (selection[0] === '') {
            console.log('no highlighted text')
            return
          }
          const payload = {
            audioConfig: {
              audioEncoding: 'LINEAR16',
              pitch: '0.00',
              speakingRate: '1.00',
            },
            input: {
              text:
                'You observe that most great scientists have tremendous drive. I worked for ten years with John Tukey at Bell Labs. He had tremendous drive. One day about three or four years after I joined, I discovered that John Tukey was slightly younger than I was. John was a genius and I clearly was not. Well I went storming into Bode’s office and said, How can anybody my age know as much as John Tukey does? He leaned back in his chair, put his hands behind his head, grinned slightly, and said, You would be surprised Hamming, how much you would know if you worked as hard as he did that many years. I simply slunk out of the office!',
            },
            voice: {
              languageCode: 'en-US',
              name: 'en-US-Wavenet-D',
            },
          }
          payload.input.text = selection[0]
          updateBadgeText('1')
          const API_KEY = await getAPIKey()
          const URL = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${API_KEY}`
          const response = await fetch(URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
            },
          })
          const { audioContent } = await response.json()
          updateBadgeText('')
          const audio = new Audio(`data:audio/wav;base64,${audioContent}`)
          audio.addEventListener('play', () => {
            chrome.browserAction.disable()
          })
          audio.addEventListener('ended', () => {
            chrome.browserAction.enable()
          })
          audio.play()
        } catch (error) {
          console.log(error)
        }
      }
    )
  })
}

chrome.browserAction.onClicked.addListener(handleBrowserActionClick)
