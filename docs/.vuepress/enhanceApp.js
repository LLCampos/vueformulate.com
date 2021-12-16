/**
 * App level enhancements. Read more here:
 * https://vuepress.vuejs.org/guide/basic-config.html#app-level-enhancements
 */
import VueFormulate from '@braid/vue-formulate'
import pageComponents from '@internal/page-components'
import Autocomplete from './Autocomplete'
import ArticleCard from './components/ArticleCard'
import GithubButton from 'vue-github-button'
import VTooltip from 'v-tooltip'
import VueCookies from 'vue-cookies'

// import '../../node_modules/prismjs/components/prism-javascript';
import '../../node_modules/prismjs/themes/prism-tomorrow.css'
import '../../node_modules/@braid/vue-formulate/themes/snow/snow.scss'

export default ({ Vue }) => {

  Vue.use(VueFormulate, {
    plugins: [ Autocomplete ]
  })

  Vue.use(VTooltip)
  Vue.use(VueCookies)

  for (const [name, component] of Object.entries(pageComponents)) {
    Vue.component(name, component)
  }
  Vue.component('github-button', GithubButton)
  Vue.component('ArticleCard', ArticleCard)
}
