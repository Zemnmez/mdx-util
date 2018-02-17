Basics
======

This example describes how JSX interacts with standard Markdown in a document compiled with MDXC. For more info on Markdown itself, check out the [original description by Daring Fireball](https://daringfireball.net/projects/markdown/).



Tags
----

The syntax of MDX is almost identical to Markdown, with the main difference being that tags in MDX represent JSX instead of HTML.

MDX, like JSX, requires all tags to be closed. This means that unclosed tags like <br> are just treated as plain text.

Properly closed tags will result in React elements. For example, `<br />` will create a line <br /> break.

And when you mix up <strong>closed and <strong>unclosed</strong> tags, MDX will treat the *last* possible opening tag as JSX, while treating earlier opening tags as text. So in this paragraph, the first `<strong>` will be text, while the latter will become a React element.





Attributes
----------

Because an MDX file compiles to a React Component, you'll need to name your attributes the React way. This means using `className` instead of `class`, `htmlFor` instead of `for`, etc.

And for <span style={{color: 'red', fontStyle: 'italic'}}>style</span>, you'll need to pass in objects. Like this:

```jsx
<span style={{color: 'red', fontStyle: 'italic'}}>
  style
</span>
```

Children
--------

The content of a pair of JSX tags will be used as the React element's `children`.

For tags which are "inline" -- i.e. within a paragraph of text, the tag's content is treated as Markdown. This means you can use <span fontStyle={{backgroundColor: 'lightgreen'}}>`backticks`, **asterisks**, etc.</span> within a span block. They can also contain other tags, so if you really wanted, you could embed a JSX <select><option>select</option></select> control in your paragraph. Importantly, {braces} are treated as text -- not JSX.

<div>
  Tag "blocks" -- where a paragraph starts and ends with the same tag -- are treated a little differently. In a tag block, the content is treated as it would be in a JSX document. This means that `backticks`, **asterisks**, etc. are plain text. And {"{braces}"} can actually be used to substitute values into your text.

  <div>
    <div>
      Indentation is also ignored, allowing you to copy and paste large blocks of code
    </div>
  </div>

  <markdown>
    # `<markdown>` tags

    But sometimes, you want to be able to write a tag block's content in Markdown. In those cases, you can use the special `<markdown>` tag to switch back to markdown mode, where {braces} are text and `backticks` are your friend.
  </markdown>
</div>





