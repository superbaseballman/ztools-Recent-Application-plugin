import { useEffect, useState } from 'react'
import Favorites from './Favorites'

export default function App() {
  const [enterAction, setEnterAction] = useState<any>({})
  const [route, setRoute] = useState('')

  useEffect(() => {
    window.ztools.onPluginEnter((action) => {
      setRoute(action.code)
      setEnterAction(action)
    })
  }, [])

  if (route === 'lightningbox' || route === 'favorites') {
    return <Favorites enterAction={enterAction} />
  }

  return <Favorites enterAction={enterAction} />
}
