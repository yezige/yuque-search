function init() {
  let submitBtn = document.getElementById('submit-btn')
  submitBtn.addEventListener('click', saveFormData)
  showFormData()
}

async function showFormData() {
  let token = document.getElementById('token')
  let toEdit = document.getElementById('to-edit')

  const options = await getOption()
  console.log(options)
  if (!options.data) {
    return
  }
  token.value = options.data.token
  toEdit.checked = options.data.toedit
}

async function saveFormData() {
  let token = document.getElementById('token')
  let toEdit = document.getElementById('to-edit')

  if (!token.value || typeof token.value == 'undefined') {
    alert('Token 不能为空')
    return
  }

  await setOption({
    token: token.value,
    toedit: toEdit.checked
  })

  alert('保存成功')
}

async function setOption(options) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('options', (data) => {
      chrome.storage.sync.set({ options: Object.assign(data.options || {}, options) })
      resolve({ success: true })
    })
  })
}

async function getOption() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('options', (data) => {
      resolve({ success: true, data: data.options })
    })
  })
}

export { setOption, getOption, init }
