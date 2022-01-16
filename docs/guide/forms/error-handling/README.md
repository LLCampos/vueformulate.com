# Error handling

Although Vue Formulate provides great [validation](/guide/validation), it's not
wise to rely solely on front end validation. It can be tedious to get error
messages from your backend into to the relevant inputs of a form. Vue formulate
provides an easy way to place both form-level and input-level errors into your
form.

## Manual error handling

We already know from the [inputs documentation](/guide/inputs#all-options) that
there are `error` and `errors` props available on all input elements.

```vue
<FormulateInput
  type="text"
  label="What is your username"
  :error="isTaken ? 'That username is already taken' : null"
/>
```
<demo-errors-1 />

These `error` props override the `error-behavior` prop (which surfaces errors
real-time via `live` or on `blur`) of the element and are displayed no
matter what. You could certainly handle all your backend errors this way but it
would still be overly verbose.

## Form input errors

`FormulateForm` has a mechanism for setting errors for every `FormulateInput`
in a form.

```vue
<FormulateForm
  :errors="{
    username: 'That username is already taken',
    password: ['You can’t re-use an old password', 'That password was too weak']
  }"
>
  <FormulateInput
    name="username"
    label="Select a username"
    type="text"
  />
  <FormulateInput
    name="password"
    label="Choose your password"
    type="password"
  />
</FormulateForm>
```
<demo-errors-2 />

As you can see in the example, the `FormulateForm` takes an object passed
via the `errors` prop and locates fields in the form that have a matching
`name`. You can define a single error string, or an array of error strings to
display.

If you set errors using `FormulateForm` and also directly on a `FormulateInput`
the values will both be shown, and any duplicates removed.

```vue
<FormulateForm
  :errors="{
    username: ['Username is too short', 'Username is already taken' ]
  }"
>
  <FormulateInput
    name="username"
    label="Select a username"
    :errors="['Username is too short', 'Invalid username characters']"
  />
</FormulateForm>
```
<demo-errors-3 />

### Group input errors <Badge text="2.5" /> {data-new}

[Inputs of type `group`](/guide/inputs/types/group/) presents an interesting
challenge because they are nested inside an array. To handle these nested and
repeatable inputs Vue Formulate supports setting errors via "dot notation".

```vue
<FormulateForm
  :errors="{
    'stocks.0.price': 'You’re paying too much for this stock',
    'stocks.2.symbol': 'That stock symbol doesn’t exist.'
  }"
>
```

:::details Full example code
```vue
<FormulateForm
  :errors="{
    'stocks.0.price': 'You’re paying too much for this stock',
    'stocks.2.symbol': 'That stock symbol doesn’t exist.'
  }"
  :values="{
    payment_method: 'mastercard',
    stocks: [
      { symbol: 'AAPL', price: '122.00' },
      { symbol: 'MSFT', price: '13.00' },
      { symbol: 'FXSW', price: '3200.00' }
    ]
  }"
>
  <FormulateInput
    label="Payment method"
    type="select"
    name="payment_method"
    :options="{
      visa: 'Visa x-4452',
      mastercard: 'Mastercard x-9927'
    }"
  />
  <FormulateInput
    type="group"
    name="stocks"
    label="Enter the names of stocks you want to purchase"
    add-label="+ Add stock"
    :repeatable="true"
  >
    <FormulateInput
      name="symbol"
      label="Stock symbol"
    />
    <FormulateInput
      name="price"
      label="Limit price"
      help="How much are you willing to pay?"
    />
  </FormulateInput>
  <FormulateInput
    type="submit"
    label="Purchase stocks"
  />
</FormulateForm>
```
:::

<demo-group-errors-2 />

:::tip Note
You can also set `group-errors` directly on the group itself. For more details
read the [`group` type documentation](/guide/inputs/types/group/).
:::

## Form errors

Occasionally, form errors are not related directly to a `FormulateInput`.
Perhaps the server is responding with a `500` status code. The `form-errors`
prop is designed for just such an occasion.

```vue
<FormulateForm
  :form-errors="['Sorry, an unexpected error occurred. Please try again soon.']"
>
  <FormulateInput
    type="text"
    name="st_address"
    label="Street Address"
  />
  <FormulateInput
    type="text"
    name="city"
    label="City"
  />
  <FormulateForm
    type="submit"
    label="Submit Order"
  />
</FormulateForm>
```
<demo-errors-4 />

By default these errors are shown at the top of the form, however often it makes
more sense to move these errors somewhere closer to the submit action of your
form. You can do this by adding a `<FormulateErrors />` component anywhere
inside the `<FormulateForm>` element.

```vue
<FormulateForm
  class="order-form"
  :form-errors="[
    'Sorry, an unexpected error occurred. Please try again soon.'
  ]"
>
  <FormulateInput
    type="text"
    name="st_address"
    label="Street Address"
  />
  <FormulateInput
    type="text"
    name="city"
    label="City"
  />
  <FormulateErrors />
  <FormulateInput
    type="submit"
    label="Submit Order"
  />
</FormulateForm>
```

<demo-errors-5 />

This automatically removes the form errors from the top and locates them wherever
that `<FormulateErrors />` is placed. You can even have multiple `<FormulateErrors />`
if you'd like the form errors to appear in multiple locations.

## Form Error handling

Now that we've covered how we display errors on forms, lets talk about how we
can actually handle those errors in a more graceful way. Lets work through a
simple login form:

#### A problematic example
```vue
<template>
  <FormulateForm
    :form-errors="formErrors"
    :errors="inputErrors"
    @submit="login"
  >
    <FormulateInput
      type="email"
      name="email"
      validation="required|email"
    />
    <FormulateInput
      type="password"
      name="password"
      validation="required"
    />
    <FormulateErrors />
    <FormulateInput
      type="submit"
      label="Login"
    />
  </FormulateForm>
</template>

<script>
export default {
  data () {
    formErrors: [],
    inputErrors: {}
  },
  methods: {
    async login () {
      try {
        const res = await this.$axios.post('/login')
        this.$cookie.setToken(res.data.token) // do some auth
      } catch (err) {
        // here's where things get nasty
        if (err.response && err.response.status) {
          switch (err.response.status) {
            case 422:
              this.inputErrors = err.response.data.errors // assign field errors
              this.formErrors = err.response.data.message
              return
            case 401:
              this.$cookie.removeToken()
              return
            // ... add lots more cases of bad things that can happen here
          }
        }
        this.formErrors = ['Sorry, an unexpected error occurred. Please try again soon..']
      }
    }
  }
}
</script>
```

Woof, that `catch` statement — what a mess, and we only handled a few of the
possible scenarios. This type of code is often abstracted away to a helper
function in a `libs` directory somewhere, but it still needs to set some local
component variables (in our case `formErrors` and `inputErrors`) in order to
give proper feedback to the user — enter [named forms](#named-forms).

### Named forms

Vue Formulate simplifies the error handling by leveraging [named
forms](/guide/forms/#named-forms) in conjunction with an error handler function.

```vue
<template>
  <FormulateForm
    name="login"
    @submit="login"
  >
    // ...login form inputs
  </FormulateForm>
</template>

<script>
<script>
export default {
  methods: {
    async login () {
      try {
        const res = await this.$axios.post('/login')
        this.$cookie.setToken(res.data.token) // do some auth
      } catch (err) {
        this.$formulate.handle(err, 'login')
      }
    }
  }
}
</script>
```
Cleaner, but lets go through it. There are a few important things to notice:

  - The form no longer has `:form-errors` and `:errors` props.
  - The form now has a `name` prop.
  - The script no longer needs `formErrors` and `inputErrors` data properties.
  - All our error handling logic is replaced with `this.$formulate.handle(err, 'login')`

#### The `errorHandler` function

So where did all that handler code go? Probably extracted to a helper file like
`libs/utils` — thats up to you, but Formulate wants to know how to access it.
When registering Vue Formulate, let it know where your error handler is.

```js
import yourErrorHandler from './libs/error-handler'

Vue.use(VueFormulate, {
  errorHandler: yourErrorHandler
})
```

So how does it work? In our component, we pass our `err` to the `handle` method
of `$formulate` along with the string `name` of the form. This `handle` method
then calls the `yourErrorHandler` and expects an object response with two properties:

```js
{
  inputErrors: { fieldName: ['Unknown email'] },
  formErrors: ['Unknown error occurred']
}
```

The `handle` method then sets those values on
your form and form inputs. This means we can have a single function for handling
all our form errors, and a one liner to set the errors. We don't even need local
data properties.

Out of the box the `errorHandler` function does nothing at all, so if we call
`handle` with the `{ inputErrors: {}, formErrors: [] }` notation we can test the
functionality. Here's an example:

```vue
<template>
  <FormulateForm
    class="order-form"
    name="order"
    @submit="order"
  >
    <FormulateInput
      type="text"
      name="st_address"
      label="Street Address"
    />
    <FormulateInput
      type="text"
      name="city"
      label="City"
    />
    <FormulateErrors />
    <FormulateInput
      type="submit"
      label="Submit Order"
    />
  </FormulateForm>
</template>

<script>
export default {
  methods: {
    order () {
      this.$formulate.handle({
        inputErrors: { st_address: 'This address doesn’t appear valid' },
        formErrors: ['Also, this form isn’t hooked up yet']
      }, 'order')
    }
  }
}
</script>
```
<demo-errors-6 />

:::tip errorHandler plugins
Once you write your error handler function, you can easily encapsulate it in a
plugin for easy re-use in the future. If you do that, consider sharing it and
we’ll post it on the plugins page.
:::
