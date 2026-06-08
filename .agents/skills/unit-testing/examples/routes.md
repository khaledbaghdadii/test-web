# Testing Routes — General patterns

Use `routes` when rendering the component

```typescript
await render(RootComponent, {
    routes: [
      {
        path: '',
        children: [
          {
            path: 'detail/:id',
            component: detailsComponentMock,
          }
        ],
      },
    ],
  });
```
