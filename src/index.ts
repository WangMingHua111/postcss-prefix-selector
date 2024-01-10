import type { Rule, TransformCallback } from 'postcss'

/**
 * 选项
 */
export type PrefixSelectorOptions = {
  /**
   * 前缀
   */
  prefix: string
  /**
   * 排除指定选择器
   */
  exclude?: (string | RegExp)[]
  /**
   * 要处理的被忽略文件列表
   */
  ignoreFiles?: (string | RegExp)[]
  /**
   * 要处理的被忽略注释列表
   * @default ['no-prefix']
   */
  ignoreAnnotations?: (string | RegExp)[]
  /**
   * 包含的要处理的文件列表
   */
  includeFiles?: (string | RegExp)[]
  /**
   * 自定义转换器
   * @param prefix 前缀
   * @param selector 选择器
   * @param prefixedSelector 默认前缀+选择器
   * @param filePath css路径
   * @param rule 规则
   * @returns
   */
  transform?: (prefix: string, selector: string, prefixedSelector: string, filePath: string, rule: Rule) => string
}
/**
 * Postcss插件，为选择器添加前缀
 * @param options
 * @returns
 */
export function PostcssPrefixSelector(options: PrefixSelectorOptions): TransformCallback {
  const { prefix, ignoreFiles = [], includeFiles = [], ignoreAnnotations = ['no-prefix'], exclude = [] } = options
  const prefixWithSpace = /\s+$/.test(prefix) ? prefix : `${prefix} `

  return function (root) {
    if (ignoreFiles.length && root.source && root.source.input.file && isFileInArray(root.source.input.file, ignoreFiles)) {
      return
    }
    if (includeFiles.length && root.source && root.source.input.file && !isFileInArray(root.source.input.file, includeFiles)) {
      return
    }

    root.walkRules((rule) => {
      const keyframeRules = ['keyframes', '-webkit-keyframes', '-moz-keyframes', '-o-keyframes']

      if (rule.parent && keyframeRules.includes(rule.parent.toString())) {
        return
      }

      rule.selectors = rule.selectors.map((selector) => {
        if (options.exclude && excludeSelector(selector, exclude)) {
          return selector
        }

        const annotation = rule.prev()
        if (annotation?.type === 'comment' && isAnnotationInArray(annotation.text.trim(), ignoreAnnotations)) {
          return selector
        }

        let prefixedSelector = prefixWithSpace + selector

        if (options.transform) {
          return options.transform(prefix, selector, prefixedSelector, root.source?.input.file || '', rule)
        }

        return prefixedSelector
      })
    })
  }
}

function isAnnotationInArray(annotation: string, arr: (string | RegExp)[]) {
  return arr.some((ruleOrString) => {
    if (ruleOrString instanceof RegExp) {
      return ruleOrString.test(annotation)
    }

    return annotation.includes(ruleOrString)
  })
}

function isFileInArray(file: string, arr: (string | RegExp)[]) {
  return arr.some((ruleOrString) => {
    if (ruleOrString instanceof RegExp) {
      return ruleOrString.test(file)
    }

    return file.includes(ruleOrString)
  })
}

function excludeSelector(selector: string, excludeArr: (string | RegExp)[]) {
  return excludeArr.some((excludeRule) => {
    if (excludeRule instanceof RegExp) {
      return excludeRule.test(selector)
    }

    return selector === excludeRule
  })
}

export default PostcssPrefixSelector
