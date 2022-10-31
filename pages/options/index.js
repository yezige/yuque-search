function init() {
  let submitBtn = document.getElementById('submit-btn')
  submitBtn.addEventListener('click', saveFormData)

  // 增加需要搜索的空间
  document.querySelector('.space_add').addEventListener('click', addSpace)
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
  setSpace(options.data.space)
}

async function saveFormData() {
  let token = document.getElementById('token')
  let toEdit = document.getElementById('to-edit')

  if (!token.value || typeof token.value == 'undefined') {
    alert('Token 不能为空')
    return
  }

  // 搜索其他空间
  let space_list = []
  const items_list = document.getElementsByName('space_list[]')
  for (const item of items_list) {
    if (item.value) {
      space_list.push(item.value)
    }
  }

  await setOption({
    token: token.value,
    toedit: toEdit.checked,
    space: space_list
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

async function timeout(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

function addSpace() {
  const space_item = `
  <div class="space_item ease_in_out">
    <input type="text" name="space_list[]" placeholder="请输入空间域名" style="width: 150px;">.yuque.com
    <span class="space_btn space_remove hover_shadow hover_bghigh"><img class="themeimg" src="/static/images/space_remove.svg" alt="" srcset=""></span>
  </div>`
  const space_list = document.querySelector('.space_list')
  space_list.insertAdjacentHTML('beforeend', space_item)
  space_list.classList.add('noempty')

  const items = document.querySelectorAll('.space_item')
  for (const item of items) {
    timeout(100).then((res) => {
      item.classList.add('show')
    })
    item.querySelector('.space_remove').removeEventListener('click', removeSpace)
    item.querySelector('.space_remove').addEventListener('click', removeSpace)
  }
}
function removeSpace(e) {
  const space_list = document.querySelector('.space_list')
  const target = e.target
  const space_item = target.closest('.space_item')
  timeout(100).then((res) => {
    space_item.classList.remove('show')
  })
  timeout(500).then((res) => {
    space_item.remove()
    if (document.querySelectorAll('.space_item').length == 0) {
      space_list.classList.remove('noempty')
    }
  })
}
function setSpace(data) {
  if (!data || !data.length) {
    return false
  }
  const space_add = document.querySelector('.space_add')
  for (const index in data) {
    space_add.click()
    document.querySelectorAll('.space_item')[index].querySelector('input').value = data[index]
  }
}

export { setOption, getOption, init }
