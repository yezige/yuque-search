import { getOption, setOption } from '../options/index.js'

const yuque_host = 'https://www.yuque.com'

var _tmp_filterExist = {}

function getApiHost(prefix) {
  prefix = prefix || 'www'
  return `https://${prefix}.yuque.com/api/v2/`
}

async function search() {
  try {
    _tmp_filterExist = {}
    const key = document.getElementById('search')
    const listBox = document.querySelector('.list')
    const popBox = document.querySelector('#popup')

    // 隐藏error内容
    hideMsg()

    if (!key.value) {
      return showMsg('请输入关键字')
    }

    // 获取配置
    const options = await getOption()
    if (!options || !options.data) {
      return showMsg('请前往选项页配置语雀 Token 后再试')
    }

    // 是否自动进入编辑页
    const toedit = options.data.toedit || false

    // 调用搜索请求
    const list = await request({
      url: `${getApiHost()}search?related=true&type=doc&q=${key.value}`,
      header: [{ header: 'X-Auth-Token', value: options.data.token }]
    })

    // 先清空搜索结果
    listBox.innerHTML = ''

    if (!list.success) {
      return showMsg(list.msg)
    }
    let list_data = filterExist(list.data.data)

    for (let space of options.data.space) {
      const space_list = await request({
        url: `${getApiHost(space)}search?related=true&type=doc&q=${key.value}`,
        header: [{ header: 'X-Auth-Token', value: options.data.token }]
      })
      if (!list.success) {
        continue
      }
      let space_data = filterExist(space_list.data.data)

      if (!space_data.length) {
        continue
      }

      // 标记文章为当前space
      for (let index in space_data) {
        space_data[index].space = space
      }
      // 把其他空间的前两条放到前边（第三条）展示，其余放到最后
      let insert_index = list_data.length > 1 ? 2 : list_data.length
      list_data.splice(insert_index, 0, ...space_data.slice(0, 2))
      list_data.push(...space_data.slice(2))
    }

    if (list_data.length == 0) {
      return showMsg('没有搜索到相关文章')
    }

    // 循环拼接html
    let listHtml = []
    for (let i in list_data) {
      const row = list_data[i]
      const rowHtml = `<a class="row${i == 0 ? ' active' : ''}" href="${yuque_host + row.url + (toedit ? '/edit' : '')}" target="_black">
        <div class="row_content">
          <div class="title">${row.title}</div>
          <div class="summary">${html2Escape(row.summary)}</div>
          ${row.space ? '<span class="space_info">' + row.space + '</span>' : ''}
        </div>
      </a>`
      listHtml.push(rowHtml)
    }
    listBox.innerHTML = listHtml.join('')
    if (!options.data.readme) {
      popBox.classList.add('min-height-230')
      showMask()
    }
  } catch (err) {
    console.log(err)
    return showMsg(err.msg || '请求异常')
  }
}

// 验证一下 _tmp_filterExist 中是否存在
function filterExist(need_insert) {
  let data = []
  for (let item of need_insert) {
    if (!_tmp_filterExist[item.id]) {
      _tmp_filterExist[item.id] = item
      data.push(item)
    }
  }
  return data
}

async function request(opt) {
  return new Promise((resolve, reject) => {
    let options = Object.assign(
      {
        method: 'GET',
        url: '',
        header: [],
        data: ''
      },
      opt
    )
    if (!options.url) {
      reject({ success: false, msg: 'url 不能为空' })
    }
    if (!['POST', 'GET'].includes(options.method.toUpperCase())) {
      reject({ success: false, msg: 'method 错误' })
    }

    var xhr = new XMLHttpRequest()
    xhr.open(options.method.toUpperCase(), options.url, true)

    // header
    if (opt.header) {
      for (let h of opt.header) {
        xhr.setRequestHeader(h.header, h.value)
      }
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) {
        return
      }
      if (xhr.status == 200) {
        resolve({ success: true, msg: '成功', data: JSON.parse(xhr.responseText) })
      } else {
        reject({ success: false, msg: xhr.statusText || '请求错误' })
      }
    }

    // data
    if (options.data) {
      if (typeof options.data == 'object') {
        let params = []
        for (let i in options.data) {
          params.push(`${i}=${options.data[i]}`)
        }
        xhr.send(params.join('&'))
      } else {
        xhr.send(options.data)
      }
    } else {
      xhr.send()
    }
  })
}

function showMsg(msg) {
  const error_box = document.getElementById('error')
  error_box.style.display = 'flex'
  error_box.querySelector('.error').innerHTML = msg
}

function hideMsg() {
  const error_box = document.getElementById('error')
  error_box.style.display = 'none'
  error_box.querySelector('.error').innerHTML = ''
}

function html2Escape(sHtml) {
  var temp = document.createElement('div')
  temp.textContent != null ? (temp.textContent = sHtml) : (temp.innerText = sHtml)
  var output = temp.innerHTML
  temp = null
  return output
}

/**
 * 测试元素是否可见，不可见时滚动一下
 * @param {element} el 元素对象
 * @param {bool} checktop 是否测试顶部可见，测试底部是否可见时传false
 * @returns {bool}
 */
function isShow(el, checktop) {
  // 是否测试顶部可见，测试底部是否可见时传false
  checktop = checktop || false
  // 窗口总高度
  const viewPortHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight

  // 不兼容的化先不滚动
  if (!el.getBoundingClientRect()) {
    return true
  }
  // list 的高度
  const listHeight = document.querySelector('.list').getBoundingClientRect().top

  const bound = el.getBoundingClientRect()
  console.log(viewPortHeight, bound)
  if (!checktop) {
    return bound.bottom <= viewPortHeight
  } else {
    return bound.top - listHeight > 0
  }
}

function init() {
  const listBox = document.querySelector('.list')

  // 搜索按钮事件
  const search_btn = document.querySelector('.search_btn')
  if (search_btn) {
    search_btn.addEventListener('click', search)
  }

  // 搜索框事件
  const search_input = document.querySelector('#search')
  let search_input_changed = true
  if (search_input) {
    search_input.focus()
    search_input.addEventListener('keypress', (e) => {
      if (e.code == 'Enter') {
        if (!search_input_changed) return
        search()
        search_input_changed = false
      }
    })
    search_input.addEventListener('input', (e) => {
      console.log(e.target.value)
      search_input_changed = true
    })
  }

  // 选择文章快捷键
  document.addEventListener('keydown', (e) => {
    const active = document.querySelector('.row.active')
    if (!active) {
      return
    }
    if (e.code == 'ArrowUp') {
      const prev = active.previousElementSibling
      if (!prev) return
      active.classList.remove('active')
      prev.classList.add('active')
      if (!isShow(prev, true)) {
        console.log('-', prev.getBoundingClientRect().height)
        listBox.scrollTop = listBox.scrollTop - (prev.getBoundingClientRect().height + 5)
      }
    }
    if (e.code == 'ArrowDown') {
      const next = active.nextElementSibling
      if (!next) return
      active.classList.remove('active')
      next.classList.add('active')
      if (!isShow(next, false)) {
        console.log('+', next.getBoundingClientRect().height)
        listBox.scrollTop = listBox.scrollTop + (next.getBoundingClientRect().height + 5)
      }
    }
    if (e.code == 'Enter') {
      if (search_input_changed) return
      active.click()
    }
  })

  // mask 事件
  document.querySelector('.mask_box .mask_btn').addEventListener('click', (e) => {
    hideMask(e.target, () => {
      setOption({ readme: true })
    })
  })
}

function showMask(el) {
  el = el || document.querySelector('.mask_box')
  el.style.display = 'block'
}

function hideMask(e, callback) {
  callback = callback || function() {}
  let el = e ? e.closest('.mask_box') : document.querySelector('.mask_box')
  el.style.display = 'none'
  callback()
}
export { init, request }
