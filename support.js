(function () {
  const templatePattern = /\{\{\s*([^}]+?)\s*\}\}/g;

  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
      this._root = null;
    }

    setState(patch) {
      this.state = Object.assign({}, this.state, patch);
      if (this._root) {
        this.render();
      }
    }

    render() {
      const values = this.renderVals();
      const root = this._root;
      if (!root) return;
      const fresh = root.cloneNode(true);
      Array.from(fresh.childNodes).forEach((node) => renderNode(node, values, fresh));
      root.parentNode.replaceChild(fresh, root);
      this._root = fresh;
    }
  }

  function safeEval(expression, scope) {
    const source = String(expression || '').trim();
    if (!source) return '';
    try {
      // eslint-disable-next-line no-new-func
      return new Function('scope', 'with (scope) { return (' + source + '); }')(scope || {});
    } catch (error) {
      return '';
    }
  }

  function resolveTemplate(input, scope) {
    if (input === undefined || input === null) return '';
    if (typeof input !== 'string') return input;
    const value = input.replace(templatePattern, (_, expression) => {
      const resolved = safeEval(expression, scope);
      return resolved === undefined || resolved === null ? '' : String(resolved);
    });
    return value;
  }

  function getNodeScope(scope, local) {
    return Object.assign({}, scope || {}, local || {});
  }

  function applyAttributeValue(el, name, value, scope) {
    if (value === undefined) return;
    const rendered = resolveTemplate(value, scope);

    if (name === 'value' || name === 'placeholder' || name === 'aria-label' || name === 'href' || name === 'title' || name === 'id' || name === 'for' || name === 'role' || name === 'aria-controls' || name === 'aria-expanded' || name === 'aria-selected' || name === 'aria-invalid' || name === 'aria-describedby' || name === 'style' || name === 'src' || name === 'alt' || name === 'type' || name === 'name' || name === 'class' || name === 'data-id') {
      el.setAttribute(name, rendered);
    }

    if (name.startsWith('on')) {
      const eventName = name.toLowerCase().replace(/^on/, '');
      const handler = safeEval(value, scope);
      if (typeof handler === 'function') {
        el.removeEventListener(eventName, handler);
        el.addEventListener(eventName, handler);
      }
    }
  }

  function renderNode(node, scope, root) {
    if (!node) return;

    if (node.nodeType === 3) {
      node.textContent = resolveTemplate(node.textContent, scope);
      return;
    }

    if (node.nodeType !== 1) return;

    const tag = node.tagName && node.tagName.toUpperCase();
    if (tag === 'SC-IF') {
      const value = resolveTemplate(node.getAttribute('value') || '', scope);
      const truthy = !!value;
      if (!truthy) {
        node.remove();
        return;
      }
      const children = Array.from(node.childNodes);
      node.replaceWith(...children);
      children.forEach((child) => renderNode(child, scope, root));
      return;
    }

    if (tag === 'SC-FOR') {
      const rawList = node.getAttribute('list');
      const itemName = (node.getAttribute('as') || 'item').trim();
      const list = resolveTemplate(rawList || '', scope);
      const items = Array.isArray(list) ? list : [];
      const parent = node.parentNode;
      if (!parent) return;

      const fragment = document.createDocumentFragment();
      items.forEach((item, index) => {
        const localScope = getNodeScope(scope, {
          [itemName]: item,
          $index: index,
          $first: index === 0,
          $last: index === items.length - 1
        });

        Array.from(node.childNodes).forEach((child) => {
          const clone = child.cloneNode(true);
          renderNode(clone, localScope, parent);
          fragment.appendChild(clone);
        });
      });

      node.replaceWith(fragment);
      return;
    }

    Array.from(node.attributes || []).forEach((attr) => {
      const name = attr.name;
      const value = attr.value;
      if (value && value.includes('{{')) {
        if (name.startsWith('on')) {
          const expression = value.match(/\{\{\s*([^}]+?)\s*\}\}/)?.[1];
          if (expression) {
            const fn = safeEval(expression, scope);
            if (typeof fn === 'function') {
              node.removeAttribute(name);
              node.addEventListener(name.toLowerCase().replace(/^on/, ''), fn);
              return;
            }
          }
        }
        node.setAttribute(name, resolveTemplate(value, scope));
      }
    });

    Array.from(node.childNodes).forEach((child) => renderNode(child, scope, root));
  }

  function bootstrap() {
    const root = document.querySelector('x-dc');
    if (!root) return;

    const scripts = Array.from(document.querySelectorAll('script[data-dc-script]'));
    if (!scripts.length) return;

    const script = scripts[0];
    const source = script.textContent || script.innerText || '';
    try {
      const result = Function(source + '\n; return { Component };')();
      if (!result || !result.Component) {
        return;
      }
      const props = script.dataset && script.dataset.props ? JSON.parse(script.dataset.props) : {};
      const instance = new result.Component(props);
      instance._root = root;
      instance.render();
    } catch (error) {
      console.error('DC bootstrap failed', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }

  window.DCLogic = DCLogic;
})();
