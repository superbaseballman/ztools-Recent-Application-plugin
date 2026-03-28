import { useEffect, useState } from 'react'
import Favorites from './Favorites'

export default function App() {
  const [enterAction, setEnterAction] = useState<any>({})

  useEffect(() => {
    window.ztools.onPluginEnter((action) => {
      setEnterAction(action)
    })
  }, [])

  return <Favorites enterAction={enterAction} />
}
