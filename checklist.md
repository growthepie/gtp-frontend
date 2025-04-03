- AI tools - Cursor
- Search Bar

# Example Checklist Flow
- Tooltip
  - Thought about how many places in our codebase this exists in
    - We can design new tooltip component, integrate as needed into our codebase
  - Check Figma - get an idea of different types of tooltips
    - Gather relevant designed components
    - Gather common styles
      - Tooltip Container (div)
        - styles: flex flex-col gap-y-[5px]/gap-y-[10px] w-[245px]/w-[460px] py-[15px] pr-[15px] text-[#CDD8D3]
        - more: rounded-[15px] bg-[#1F2726] shadow-[0px_0px_4px_0px_rgba(0,_0,_0,_0.25)]/shadow-[0px_0px_30px_0px_rgba(0,_0,_0,_1)]
        - children
          - Header (div)
            - styles: flex (flex-row) w-full gap-x-[10px]/gap-[5px] pl-[20px] h-[18px]/h-[24px]
            - children
              - Icon (optional) - GTPIcon or any other icon
                - styles: size-[15px]/size-[26px] (sm/md)
              - Text
                - styles: heading-small-xs h-[18px]
          - Body (div)
            - styles: flex flex-col w-full
            - children - most will have pl-[15px] or pl-[20px], we'll leave lots of room for flexibility here
          - Footer (div)
            - styles: flex flex-col w-full
            - children - most will have pl-[15px] or pl-[20px], we'll leave lots of room for flexibility here
            
          