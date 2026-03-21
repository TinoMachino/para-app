import {forwardRef} from 'react'
import {findNodeHandle, View} from 'react-native'

import {List} from '#/view/com/util/List'
import {type ListRef} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {type SectionRef} from './types'

interface Props {
  headerHeight: number
  scrollElRef: ListRef
  setScrollViewTag: (tag: number | null) => void
  isFocused: boolean
}

// Mock Data
import {PROFILE_VOTES as MOCK_VOTES} from '#/lib/mock-data'

export const ProfileVotesSection = forwardRef<SectionRef, Props>(
  function ProfileVotesSection(
    {headerHeight, scrollElRef, setScrollViewTag, isFocused},
    ref,
  ) {
    const t = useTheme()

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        scrollElRef.current?.scrollToOffset({
          offset: -headerHeight,
          animated: true,
        })
      },
    }))

    useEffect(() => {
      if (IS_IOS && isFocused && scrollElRef.current) {
        // @ts-ignore
        const nativeTag = findNodeHandle(scrollElRef.current)
        setScrollViewTag(nativeTag)
      }
    }, [isFocused, scrollElRef, setScrollViewTag])

    const renderItem = ({item}: {item: (typeof MOCK_VOTES)[0]}) => (
      <View style={[a.p_md, a.border_b, t.atoms.border_contrast_low]}>
        <Text style={[a.text_md, a.font_bold]}>{item.title}</Text>
        <View style={[a.flex_row, a.justify_between, a.mt_xs]}>
          <Text style={[t.atoms.text_contrast_medium]}>
            Voted:{' '}
            <Text
              style={[
                a.font_bold,
                {
                  color:
                    item.vote === 'Yes'
                      ? t.palette.positive_600
                      : t.palette.negative_600,
                },
              ]}>
              {item.vote}
            </Text>
          </Text>
          <Text style={[t.atoms.text_contrast_low]}>{item.date}</Text>
        </View>
      </View>
    )

    return (
      <List
        ref={scrollElRef}
        data={MOCK_VOTES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        headerOffset={headerHeight}
        contentContainerStyle={{
          minHeight: '100%',
          paddingBottom: 100,
        }}
      />
    )
  },
)
