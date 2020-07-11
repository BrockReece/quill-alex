import Quill from 'quill'
import Delta from 'quill-delta'
import alex from 'alex'
import debounce from 'lodash.debounce'

Quill.register('modules/alex', (quill, options = {}) => {
  let container = options.container
  if (!container) {
    quill.root.parentElement.insertAdjacentHTML('afterend', '<details class="ql-container ql-snow ql-alex-results"></details>')
    container = quill.root.parentElement.nextSibling
  }

  quill.on('text-change', debounce(() => {
    const text = quill.getText().replace(/\n/g, ' ')
    const alexResults = alex.text(text, options.config)
    const issueCount = alexResults.messages.length

    const messages = alexResults.messages.map((m) => {
      const index = m.location.start.offset
      const length = m.location.end.offset - m.location.start.offset

      let message = m.message.replace('`' + m.actual + '`', `<code class="alex-bad">${m.actual}</code>`)

      if (m.expected) {
        m.expected.forEach((expected) => {
          message = message.replace('`' + expected + '`', `<code class="alex-ok" data-start="${index}" data-length="${length}" data-expected="${expected}">${expected}</code>`)
        })
      }

      return `<div class="alex-warning">${message}</div>`
    })
    container.innerHTML = `
      <summary>${issueCount || 'No'} issues found</summary>
      <p>${messages.join('')}</>
    `

    container.querySelectorAll('.alex-ok').forEach((element) => {
      element.addEventListener('click', (event) => {
        const dataset = event.target.dataset
        quill.updateContents(new Delta()
          .retain(Number(dataset.start))
          .delete(Number(dataset.length))
          .insert(dataset.expected)
        )
      })
    })
  }, options.debounce || 500))
})
